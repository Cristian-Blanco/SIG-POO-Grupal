// Inicializar el mapa centrado en Colombia
const map = L.map('map').setView([4.6, -74.1], 6);

// Capa base OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Control para mostrar información del municipio resaltado
const info = L.control();

info.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info');
  this.update();
  return this._div;
};

info.update = function (props) {
  this._div.innerHTML = '<h4>Municipio</h4>' + 
    (props ? `<b>${props.NOMBRE_MUN}</b>` : 'Pasa el cursor sobre un municipio');
};

info.addTo(map);

// Función para definir color (por ahora estático)
function getColor() {
  return '#3388ff';
}

// Estilo por defecto
function style(feature) {
  return {
    fillColor: getColor(),
    weight: 1,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
  };
}

// Resaltar municipio al pasar el mouse
function highlightFeature(e) {
  const layer = e.target;
  layer.setStyle({
    weight: 3,
    color: '#666',
    dashArray: '',
    fillOpacity: 0.9
  });

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }

  info.update(layer.feature.properties);
}

// Quitar el resaltado
function resetHighlight(e) {
  geojson.resetStyle(e.target);
  info.update();
}

// Eventos por cada municipio
function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight
  });
}

let geojson;

// Cargar GeoJSON de municipios
fetch('https://gist.githubusercontent.com/john-guerra/727e8992e9599b9d9f1dbfdc4c8e479e/raw/090f8b935a437e24d65b64d87598fbb437c006da/colombia-municipios.json')
  .then(response => response.json())
  .then(data => {
    geojson = L.geoJson(data, {
      style: style,
      onEachFeature: onEachFeature
    }).addTo(map);
  })
  .catch(err => console.error('Error al cargar GeoJSON:', err));
