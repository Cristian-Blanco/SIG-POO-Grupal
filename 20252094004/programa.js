// PASOS DEL TUTORIAL
const pasos = [
    {
        titulo: "Cargar librerías",
        texto: "Usamos Leaflet para mostrar mapas y Turf.js para cálculos geográficos. Leaflet trabaja con datos tipo 'coordenadas' y Turf usa geometrías GeoJSON."
    },
    {
        titulo: "Mostrar el mapa",
        texto: "Creamos un mapa centrado en Bogotá (latitud 4.7110, longitud -74.0721) con un nivel de zoom 2 para ver el mundo completo."
    },
    {
        titulo: "Añadir marcador de Bogotá",
        texto: "Ponemos un marcador rojo en Bogotá para tener un punto de referencia fijo. No desaparecerá aunque interactúes con el mapa."
    },
    {
        titulo: "Cargar países",
        texto: "Usamos datos GeoJSON de todos los países para poder calcular distancias desde Bogotá al centro de cada país."
    },
    {
        titulo: "Calcular distancias",
        texto: "Turf calcula la distancia en kilómetros desde Bogotá al centroide de cada país usando coordenadas geográficas."
    },
    {
        titulo: "Mostrar resultados",
        texto: "Coloreamos los países según la distancia y al hacer clic mostramos un popup con la distancia desde Bogotá y el nombre del país."
    }
];

let pasoActual = 0;
const explicacionDiv = document.getElementById("explicacion");

function mostrarPaso() {
    const paso = pasos[pasoActual];
    explicacionDiv.innerHTML = `<h3>${paso.titulo}</h3><p>${paso.texto}</p>`;
}
document.getElementById("prev").addEventListener("click", () => {
    if (pasoActual > 0) pasoActual--;
    mostrarPaso();
});
document.getElementById("next").addEventListener("click", () => {
    if (pasoActual < pasos.length - 1) pasoActual++;
    mostrarPaso();
});
mostrarPaso();

// MAPA
const map = L.map('map').setView([4.7110, -74.0721], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map);

// MARCADOR FIJO DE BOGOTÁ
const bogotaMarker = L.marker([4.7110, -74.0721], { title: "Bogotá" })
    .bindPopup("📍 Bogotá, Colombia")
    .addTo(map);

// PUNTO DE BOGOTÁ (para Turf)
const bogota = turf.point([-74.0721, 4.7110]);

// CARGAR GEOJSON DE PAÍSES
fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
    .then(res => res.json())
    .then(data => {
        L.geoJSON(data, {
            style: feature => ({
                color: "#555",
                weight: 1,
                fillColor: "#6baed6",
                fillOpacity: 0.5
            }),
            onEachFeature: (feature, layer) => {
                const centroid = turf.centroid(feature);
                const distancia = turf.distance(bogota, centroid, { units: 'kilometers' }).toFixed(2);
                const nombrePais = feature.properties.ADMIN || feature.properties.name || "País desconocido";
                const coords = centroid.geometry.coordinates;
                const ciudad = `${coords[1].toFixed(2)}, ${coords[0].toFixed(2)}`;
                
                layer.bindPopup(`<strong>Distancia desde Bogotá a ${nombrePais}</strong><br>${distancia} km`);
            }
        }).addTo(map);
    });
