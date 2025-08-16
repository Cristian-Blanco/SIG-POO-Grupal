/*****  Configuración básica  *****/
const BOGOTA = { lat: 4.60971, lon: -74.08175 };              // Leaflet usa [lat, lon]
const BOGOTA_TURF = turf.point([BOGOTA.lon, BOGOTA.lat]);      // Turf usa [lon, lat]
const DATA_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';

// Contenedores de capas opcionales
let capaCentroides = null;
let capaLineas = L.layerGroup();

/*****  Crear mapa  *****/
const map = L.map('map', { worldCopyJump: true }).setView([20, 0], 2);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap · © CARTO'
}).addTo(map);

// Marcador fijo en Bogotá
L.marker([BOGOTA.lat, BOGOTA.lon], { title: 'Bogotá, Colombia' })
  .addTo(map)
  .bindPopup('<strong>Bogotá</strong><br>Capital de Colombia');

/*****  Utilidades  *****/
const fmtKm = (n) => Number(n).toLocaleString('es-CO', { maximumFractionDigits: 2 });

function nombrePais(props) {
  // Evita 'undefined' pase lo que pase
  return props?.ADMIN || props?.name || 'País desconocido';
}

/*****  Cargar países y preparar capa  *****/
fetch(DATA_URL)
  .then(r => r.json())
  .then((geojson) => {
    // Crear capa de países con comportamiento
    const paises = L.geoJSON(geojson, {
      style: {
        color: '#00FFFF',
        weight: 1,
        fillOpacity: 0.15
      },
      onEachFeature: (feature, layer) => {
        // Centroides y distancia
        const c = turf.centroid(feature);                     // Point [lon, lat]
        const km = turf.distance(BOGOTA_TURF, c, { units: 'kilometers' });

        // Guardamos para reutilizar en eventos
        const [clon, clat] = c.geometry.coordinates;
        layer.feature.properties.__centroid = { lat: clat, lon: clon };
        layer.feature.properties.__km = km;

        // Popup
        const nombre = nombrePais(feature.properties);
        layer.bindPopup(
          `<strong>Distancia desde Bogotá a ${nombre}:</strong><br>${fmtKm(km)} km`
        );

        // Al hacer clic: si está activo el toggle, dibujar línea Bogotá → centroide
        layer.on('click', () => {
          if (document.getElementById('toggleLineas').checked) {
            const p1 = [BOGOTA.lat, BOGOTA.lon];
            const p2 = [clat, clon];
            // Limpiamos y dibujamos la nueva línea
            capaLineas.clearLayers();
            L.polyline([p1, p2], { color: '#ffd166', weight: 2 }).addTo(capaLineas);
            capaLineas.addTo(map);
          }
        });
      }
    }).addTo(map);

    // Centroides (se crean pero no se muestran hasta que actives el toggle)
    const puntos = [];
    geojson.features.forEach((f) => {
      const c = f.properties.__centroid
        ? [f.properties.__centroid.lat, f.properties.__centroid.lon]
        : (() => {
            const cc = turf.centroid(f).geometry.coordinates;
            return [cc[1], cc[0]];
          })();

      const nombre = nombrePais(f.properties);
      const km = f.properties.__km ?? turf.distance(BOGOTA_TURF, turf.point([c[1], c[0]]), { units: 'kilometers' });

      const m = L.circleMarker(c, {
        radius: 4,
        color: '#a37900',
        weight: 0.8,
        fillColor: '#ffd166',
        fillOpacity: 0.95
      }).bindTooltip(`${nombre}<br><small>${fmtKm(km)} km</small>`, { sticky: true });

      puntos.push(m);
    });
    capaCentroides = L.layerGroup(puntos); // aún no se añade

  })
  .catch((e) => {
    console.error(e);
    alert('No se pudieron cargar los países. Verifica tu conexión.');
  });

/*****  Toggles UI  *****/
// Mostrar / ocultar centroides
document.getElementById('toggleCentroides').addEventListener('change', (ev) => {
  if (!capaCentroides) return;
  if (ev.target.checked) {
    capaCentroides.addTo(map);
  } else {
    map.removeLayer(capaCentroides);
  }
});

// Borrar línea cuando se apaga el toggle de líneas
document.getElementById('toggleLineas').addEventListener('change', (ev) => {
  if (!ev.target.checked) capaLineas.clearLayers();
});

/*****  Modales (paso a paso)  *****/
const openModal = (id) => document.getElementById(id).setAttribute('aria-hidden', 'false');
const closeModal = (id) => document.getElementById(id).setAttribute('aria-hidden', 'true');

// Abrir desde tarjetas
document.querySelectorAll('.card[data-modal]').forEach(card => {
  card.addEventListener('click', (e) => {
    // Evita doble click en botón vs tarjeta
    const id = card.getAttribute('data-modal');
    openModal(id);
  });
});

// Cerrar con botones [x]
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const modal = e.target.closest('.modal');
    if (modal) modal.setAttribute('aria-hidden', 'true');
  });
});

// Cerrar al hacer click fuera del contenido
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      m.setAttribute('aria-hidden', 'true');
    }
  });
});
