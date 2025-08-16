// Coordenadas de Bogotá (lat, lon)
const BOGOTA = [4.60971, -74.08175];

// GeoJSON de países (110m aprox). Alternativas:
//  - datasets/geo-countries: buena cobertura y CORS ok
const GEOJSON_URL = "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

const map = L.map("map", {
  worldCopyJump: true,
  preferCanvas: true
}).setView([0, 0], 2);

// Basemap oscuro tipo "carto-darkmatter" (sin token)
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>',
  subdomains: "abcd",
  maxZoom: 19
}).addTo(map);

// Crea tooltip bonito
function bindCountryTooltip(layer, props) {
  const name = props.ADMIN || props.NAME || props.name || "País";
  const dist = props.distancia_km != null ? Math.round(props.distancia_km).toLocaleString() : "—";
  const html = `
    <div><strong>${name}</strong></div>
    <div>Distancia a Bogotá: <strong>${dist}</strong> km</div>
  `;
  layer.bindTooltip(html, { direction: "top", className: "custom-tip", sticky: true });
}

// Leyenda (se actualiza después de calcular dominio)
function renderLegend(min, max, scale) {
  const legend = document.getElementById("legend");
  legend.innerHTML = `
    <h4>Distancia a Bogotá (km)</h4>
    <div class="scale" id="legend-scale"></div>
    <div class="ticks">
      <span>${Math.round(min).toLocaleString()}</span>
      <span>${Math.round((min + max) / 2).toLocaleString()}</span>
      <span>${Math.round(max).toLocaleString()}</span>
    </div>
  `;
  const steps = 200;
  const grad = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    grad.push(scale(min + t * (max - min)).hex());
  }
  document.getElementById("legend-scale").style.background = `linear-gradient(to right, ${grad.join(",")})`;
}

// Carga GeoJSON, calcula centroides y distancias, y dibuja
async function init() {
  const res = await fetch(GEOJSON_URL);
  const geojson = await res.json();

  // Turf usa [lon, lat]
  const bogotaPoint = turf.point([BOGOTA[1], BOGOTA[0]]);

  // Calcular distancia y centroides por feature
  let minD = Infinity;
  let maxD = -Infinity;

  for (const f of geojson.features) {
    try {
      // Centroide geodésico
      const c = turf.centroid(f);
      const [clon, clat] = c.geometry.coordinates;

      // Distancia geodésica en km
      const d = turf.distance(bogotaPoint, c, { units: "kilometers" });

      f.properties.centroid = { lat: clat, lon: clon };
      f.properties.distancia_km = d;

      if (isFinite(d)) {
        if (d < minD) minD = d;
        if (d > maxD) maxD = d;
      }
    } catch (e) {
      // Geometrías problemáticas (raro a 110m), ignora
      // console.warn("Error en feature:", e);
    }
  }

  // Escala de color tipo Plasma con chroma.js
  // Nota: en tu código original usaste "Plasma" de Plotly; aquí replicamos con chroma.scale('plasma')
  const colorScale = chroma.scale("plasma").domain([minD, maxD]);

  // Capa de países (coropleta)
  const countriesLayer = L.geoJSON(geojson, {
    style: (feat) => {
      const d = feat.properties.distancia_km;
      const fill = isFinite(d) ? colorScale(d).hex() : "#666";
      return {
        color: "#1b2232",       // borde
        weight: 0.5,
        fillColor: fill,        // color según distancia
        fillOpacity: 0.5
      };
    },
    onEachFeature: (feat, layer) => {
      bindCountryTooltip(layer, feat.properties);

      // Highlight al pasar el mouse
      layer.on({
        mouseover: (e) => e.target.setStyle({ weight: 1.5, color: "#4a90e2" }),
        mouseout: (e) => countriesLayer.resetStyle(e.target)
      });
    }
  }).addTo(map);

  // Capa de centroides (dorados)
  const centroidMarkers = [];
  geojson.features.forEach((f) => {
    const c = f.properties.centroid;
    if (!c) return;
    const marker = L.circleMarker([c.lat, c.lon], {
      radius: 4,
      weight: 0.5,
      color: "#a37900",
      fillColor: "#ffd166", // gold
      fillOpacity: 0.9
    });
    const name = f.properties.ADMIN || f.properties.NAME || f.properties.name || "País";
    marker.bindTooltip(
      `<div><strong>${name}</strong></div><div>Centroid</div>`,
      { direction: "top", className: "custom-tip", sticky: true }
    );
    centroidMarkers.push(marker);
  });
  L.layerGroup(centroidMarkers).addTo(map);

  // Punto de Bogotá (círculo cyan)
  L.circleMarker(BOGOTA, {
    radius: 7,
    weight: 1,
    color: "#00bcd4",
    fillColor: "#00e5ff",
    fillOpacity: 0.95
  }).bindTooltip("<strong>Centroide Bogotá</strong>", { className: "custom-tip", sticky: true }).addTo(map);

  // Leyenda
  renderLegend(minD, maxD, (v) => colorScale(v));

  // Ajuste de vista
  try {
    map.fitBounds(countriesLayer.getBounds(), { padding: [10, 10] });
  } catch (_) {
    map.setView([0, 0], 2);
  }
}

init().catch((e) => {
  console.error(e);
  alert("Ocurrió un error cargando los datos del mapa.");
});
