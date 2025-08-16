// Crear el mapa centrado en Antioquia
var map = L.map('map').setView([6.09, -75.64], 10);

// Capa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// URL del GeoJSON de municipios de Colombia
var geojsonURL = "https://raw.githubusercontent.com/john-guerra/ColombiaGeoJSON/master/colombia_municipios.geo.json";

// Función para estilo de polígonos
function estilo(feature) {
    return {
        fillColor: "#FF5733",
        weight: 2,
        opacity: 1,
        color: "#000",
        fillOpacity: 0.7
    };
}

// Cargar y filtrar
fetch(geojsonURL)
    .then(response => response.json())
    .then(data => {
        L.geoJson(data, {
            style: estilo,
            filter: function (feature) {
                return feature.properties.NOM_DPTO === "ANTIOQUIA" &&
                       feature.properties.NOMBRE_MUN === "CALDAS";
            },
            onEachFeature: function (feature, layer) {
                layer.bindPopup(
                    "<strong>Municipio:</strong> " + feature.properties.NOMBRE_MUN +
                    "<br><strong>Departamento:</strong> " + feature.properties.NOM_DPTO
                );
            }
        }).addTo(map);
    })
    .catch(err => console.error(err));
