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

// 3) Cargar Troncales de TransMilenio (ArcGIS FeatureServer)
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

// 4) Control de capas
const overlayMaps = {
  'Localidades': localidadesLayer,
  'Troncales TransMilenio': troncalesLayer
};
L.control.layers({}, overlayMaps, { collapsed: true }).addTo(map);

// 5) Leyenda
const legend = L.control({ position: 'bottomleft' });
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'legend');
  div.innerHTML = `
    <div><span class="swatch" style="background:#6fa8dc;border:1px solid #444"></span> Localidades</div>
    <div><span class="swatch" style="background:red"></span> Troncales TransMilenio</div>
  `;
  return div;
};
legend.addTo(map);
