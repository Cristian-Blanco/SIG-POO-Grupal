// 1) Inicializar mapa centrado en Bogotá
const map = L.map('map', {
  center: [4.60971, -74.08175],
  zoom: 12
});

// Capa base OSM
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// 2) Cargar Troncales de TransMilenio (ArcGIS FeatureServer)
const troncalesUrl =
  'https://gis.transmilenio.gov.co/arcgis/rest/services/Troncal/consulta_trazados_troncales/FeatureServer/0';

const troncalesLayer = L.esri
  .featureLayer({
    url: troncalesUrl,
    fields: ['*'],
    style: () => ({
      color: 'red',
      weight: 3
    })
  })
  .on('click', function (e) {
    const props = e.layer.feature?.properties || {};
    const nombre = props.NOMBRE || props.nombre || 'Troncal';
    L.popup()
      .setLatLng(e.latlng)
      .setContent(`<strong>${nombre}</strong>`)
      .openOn(map);
  })
  .addTo(map);

// 3) Cargar Estaciones de TransMilenio (puntos)
const estacionesUrl =
  'https://gis.transmilenio.gov.co/arcgis/rest/services/Troncal/consulta_estaciones_troncales/FeatureServer/0';

const estacionesLayer = L.esri
  .featureLayer({
    url: estacionesUrl,
    fields: ['*'],
    pointToLayer: (geojson, latlng) => {
      return L.circleMarker(latlng, {
        radius: 6,
        fillColor: 'blue',
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.9
      });
    }
  })
  .on('click', function (e) {
    const p = e.layer.feature?.properties || {};
    const nombre = p.nombre_estacion || p.numero_estacion || 'Estación';
    const troncal = p.troncal_estacion ? `<br><small>Troncal: ${p.troncal_estacion}</small>` : '';
    L.popup()
      .setLatLng(e.latlng)
      .setContent(`<strong>${nombre}</strong>${troncal}`)
      .openOn(map);
  })
  .on('requesterror', (err) => {
    console.error('Error consultando estaciones:', err);
  })
  .addTo(map);
