var map = L.map('map').setView([-74.11905546704762, 4.511947469569499 ], 14); // Bogotá

// Capa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
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
        console.log("GeoJSON cargado:", data); // Validación
        L.geoJSON(data).addTo(map);
    })
    .catch(error => console.error("Error al cargar el GeoJSON:", error));
