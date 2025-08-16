// Inicializar mapa
var map = L.map('map').setView([-74.11888097912265, 4.5111155476835965], 14);

// Capa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(mapa);



L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);
// Elementos de la interfaz
const infoDiv = document.getElementById('info');
const mapaDiv = document.getElementById('map');

// Info de parques (ejemplo, debes rellenar)
const infoParques = {
    "Parque La Esperanza": {
        img: "img/esperanza.jpg",
        desc: "Un parque amplio con zonas verdes y juegos infantiles."
    },
    "Parque El Progreso": {
        img: "img/progreso.jpg",
        desc: "Parque con canchas deportivas y senderos."
    }
};

// Función cerrar panel
function cerrarPanel() {
    infoDiv.style.display = 'none';
    mapaDiv.style.flex = 'auto';
}

// Cargar GeoJSON
fetch('Parques-Marichuela.geojson')
    .then(response => response.json())
    .then(data => {
        console.log("GeoJSON cargado:", data); // 👈 verificar aquí
        L.geoJSON(data).addTo(map);
    })
    .catch(error => console.error("Error al cargar el GeoJSON:", error));
