// Inicializar mapa en Bogotá
var map = L.map('map').setView([4.711, -74.072], 11);

// Capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Estaciones climatológicas ficticias en Bogotá
let estaciones = [
    { nombre: "Estación Suba", lat: 4.75, lon: -74.08 },
    { nombre: "Estación Engativá", lat: 4.72, lon: -74.12 },
    { nombre: "Estación Kennedy", lat: 4.63, lon: -74.15 }
];

// Consultar datos de clima en Open-Meteo
estaciones.forEach(estacion => {
    let url = `https://api.open-meteo.com/v1/forecast?latitude=${estacion.lat}&longitude=${estacion.lon}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=auto`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            let lluvia = data.daily.precipitation_sum[0]; // lluvia de hoy
            let tempMax = data.daily.temperature_2m_max[0];
            let tempMin = data.daily.temperature_2m_min[0];

            // Agregar marcador en el mapa
            L.marker([estacion.lat, estacion.lon]).addTo(map)
                .bindPopup(`
                    <b>${estacion.nombre}</b><br>
                    🌧️ Lluvia hoy: ${lluvia} mm<br>
                    🌡️ Temp. Máx: ${tempMax} °C<br>
                    🌡️ Temp. Mín: ${tempMin} °C
                `);
        })
        .catch(error => console.error("Error al consultar API:", error));
});
