// Inicializar mapa (derecha)
const map = L.map('map', {
  center: [4.60971, -74.08175],
  zoom: 12
});

// Capa base OSM
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// --- Troncales (líneas) ---
const troncalesUrl =
  'https://gis.transmilenio.gov.co/arcgis/rest/services/Troncal/consulta_trazados_troncales/FeatureServer/0';

const troncalesLayer = L.esri
  .featureLayer({
    url: troncalesUrl,
    fields: ['*'],
    style: () => ({ color: 'red', weight: 3 })
  })
  .on('click', (e) => {
    const p = e.layer.feature?.properties || {};
    const nombre = p.NOMBRE || p.nombre || p.troncal || 'Troncal';
    L.popup()
      .setLatLng(e.latlng)
      .setContent(`<strong>${nombre}</strong>`)
      .openOn(map);
  })
  .addTo(map);

// --- Estaciones (puntos) ---
// Si tu endpoint de estaciones es otro, reemplaza el URL de abajo.
const estacionesCandidates = [
  'https://gis.transmilenio.gov.co/arcgis/rest/services/Estaciones/consulta_estaciones/FeatureServer/0',
  'https://gis.transmilenio.gov.co/arcgis/rest/services/Troncal/consulta_estaciones_troncales/FeatureServer/0'
];

// Intentar con el primer URL disponible
function addEstaciones(urlIndex = 0) {
  if (urlIndex >= estacionesCandidates.length) {
    console.error('No se pudo cargar la capa de estaciones con las URLs probadas.');
    return;
  }
  const url = estacionesCandidates[urlIndex];

  const layer = L.esri.featureLayer({
    url,
    fields: ['*'],
    pointToLayer: (_geojson, latlng) =>
      L.circleMarker(latlng, {
        radius: 6,
        fillColor: 'blue',
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.9
      })
  })
  .on('click', (e) => {
    const p = e.layer.feature?.properties || {};
    const nombre =
      p.nombre_estacion || p.NOMBRE || p.nombre || p.numero_estacion || 'Estación';
    const troncal = p.troncal_estacion || p.troncal || '';
    L.popup()
      .setLatLng(e.latlng)
      .setContent(
        `<strong>${nombre}</strong>${troncal ? `<br><small>Troncal: ${troncal}</small>` : ''}`
      )
      .openOn(map);
  })
  .on('requesterror', () => {
    // Si falla este endpoint, probamos el siguiente candidato
    map.removeLayer(layer);
    addEstaciones(urlIndex + 1);
  })
  .addTo(map);

  return layer;
}
const estacionesLayer = addEstaciones(0);

// Control de capas
const overlays = {
  'Troncales TransMilenio': troncalesLayer
};
// Solo agregamos estaciones si la variable existe como capa Leaflet
if (estacionesLayer) overlays['Estaciones TransMilenio'] = estacionesLayer;

L.control.layers({}, overlays, { collapsed: true }).addTo(map);

// Leyenda
const legend = L.control({ position: 'bottomleft' });
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'legend');
  div.innerHTML = `
    <div><span class="swatch" style="background:red"></span> Troncales TransMilenio</div>
    <div><span class="swatch" style="background:blue;border:1px solid #fff"></span> Estaciones TransMilenio</div>
  `;
  return div;
};
legend.addTo(map);

// Ajuste por si el mapa inicia oculto/reflow
window.addEventListener('resize', () => {
  map.invalidateSize();
});
