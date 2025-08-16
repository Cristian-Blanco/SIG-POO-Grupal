// Inicializar mapa
const mapa = L.map('map').setView([4.563, -74.11], 15); // Ajusta coordenadas iniciales

// Capa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(mapa);

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
    .then(res => res.json())
    .then(data => {
        const geojsonLayer = L.geoJSON(data, {
            onEachFeature: (feature, layer) => {
                // Propiedad del nombre (ajusta según tu archivo)
                const nombre = feature.properties?.Nombre || feature.properties?.name || "Parque sin nombre";
                
                // Popup básico
                layer.bindPopup(nombre);

                // Evento click
                layer.on('click', () => {
                    infoDiv.style.display = 'block';
                    mapaDiv.style.flex = '1';

                    if (infoParques[nombre]) {
                        infoDiv.innerHTML = `
                            <button class="btn-cerrar" onclick="cerrarPanel()">Cerrar</button>
                            <h2>Descripción general</h2>
                            <h3>${nombre}</h3>
                            <img src="${infoParques[nombre].img}" alt="${nombre}">
                            <p>${infoParques[nombre].desc}</p>
                        `;
                    } else {
                        infoDiv.innerHTML = `
                            <button class="btn-cerrar" onclick="cerrarPanel()">Cerrar</button>
                            <h2>Descripción general</h2>
                            <h3>${nombre}</h3>
                            <p>No hay descripción disponible para este parque.</p>
                        `;
                    }
                });
            },
            style: {
                color: "green",
                weight: 2,
                fillOpacity: 0.4
            }
        }).addTo(mapa);

        // Ajustar zoom automáticamente a los polígonos
        mapa.fitBounds(geojsonLayer.getBounds());
    })
    .catch(err => console.error("Error cargando GeoJSON:", err));
