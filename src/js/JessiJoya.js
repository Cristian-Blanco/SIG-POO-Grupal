// Crear mapa centrado en Bogotá
var map = L.map('map').setView([4.7110, -74.0721], 11);

// Capa base CartoDB Positron
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
}).addTo(map);

// URLs de datos GeoJSON
var localidades_url = "https://services2.arcgis.com/NEwhEo9GGSHXcRXV/arcgis/rest/services/Mapa_localidades_bogota_jrm_WFL1/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson";
var rutas_troncales_url = "https://gis.transmilenio.gov.co/arcgis/rest/services/Troncal/consulta_rutas_troncales/MapServer/0/query?where=1%3D1&outFields=*&f=geojson";

// Función estilo para localidades
function styleLocalidad(feature) {
  return {
    fillColor: "#ADD8E6",
    color: "#0b3d91",
    weight: 1,
    fillOpacity: 0.45
  };
}

// Función estilo para rutas
function styleRuta(feature) {
  return {
    color: "#0b66c3",
    weight: 3,
    opacity: 0.9
  };
}

// Cargar localidades
fetch(localidades_url)
  .then(res => res.json())
  .then(data => {
    L.geoJson(data, {
      style: styleLocalidad,
      onEachFeature: function (feature, layer) {
        let nombre = feature.properties.NOM_LOC || feature.properties.NOMBRE || "Localidad";
        layer.bindTooltip("Localidad: " + nombre);
      }
    }).addTo(map);
  });

// Cargar rutas
fetch(rutas_troncales_url)
  .then(res => res.json())
  .then(data => {
    L.geoJson(data, {
      style: styleRuta,
      onEachFeature: function (feature, layer) {
        let nombre = feature.properties.ruta || feature.properties.NAME || "Ruta";
        layer.bindTooltip("Ruta: " + nombre);
      }
    }).addTo(map);
  });
