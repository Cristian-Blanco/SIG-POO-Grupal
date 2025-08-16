// programa.js

// Inicializar el mapa centrado en Colombia
const map = L.map('map').setView([4.605240373027705, -74.07673993624353], 16);



// Cargar la capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map); 

 src="https://code.jquery.com/jquery-3.6.0.min.js"
 
var estiloPoligonoBarrio = {
    fillColor: "#09435C",       // Azul para el relleno
    color: "#031821",           // Azul más oscuro para el borde
    weight: 1,                  // Grosor del borde
    opacity: 1                  // Opacidad del borde
  };
 // Cargar el archivo GeoJSON del polígono del Barrio
  $.getJSON('Lotes_La_Capuchina.geojson', function(data) {
    L.geoJSON(data, {
      style: estiloPoligonoBarrio
    }).addTo(map);
})
