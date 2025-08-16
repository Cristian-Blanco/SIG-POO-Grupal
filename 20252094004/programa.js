// ----- Configuración del mapa -----
const mapa = L.map('mapa').setView([4.711, -74.072], 2);

// Basemap oscuro de Carto
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(mapa);

// Coordenadas de Bogotá
const bogota = turf.point([-74.072, 4.711]);

// Marcador fijo en Bogotá
L.marker([4.711, -74.072]).addTo(mapa)
    .bindPopup("Bogotá, Colombia");

// Cargar GeoJSON con países
fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            onEachFeature: function (feature, layer) {
                const centroid = turf.centroid(feature);
                const distancia = turf.distance(bogota, centroid, { units: 'kilometers' }).toFixed(2);
                const nombrePais = feature.properties.ADMIN || feature.properties.name || "País desconocido";
                layer.bindPopup(`<strong>Distancia desde Bogotá a ${nombrePais}</strong><br>${distancia} km`);
            }
        }).addTo(mapa);
    });

// ----- Explicaciones paso a paso -----
const pasos = [
    "Paso 1: Usamos Leaflet para mostrar un mapa interactivo en la web. Leaflet es una librería JavaScript que permite añadir mapas fácilmente.",
    "Paso 2: Definimos las coordenadas de Bogotá. Esto nos servirá como punto de referencia para calcular distancias.",
    "Paso 3: Cargamos un archivo GeoJSON que contiene las fronteras de todos los países. GeoJSON es un formato para representar datos geográficos usando texto (JSON).",
    "Paso 4: Calculamos la distancia desde Bogotá al centro (centroide) de cada país usando Turf.js. Turf.js es una librería para análisis geoespacial.",
    "Paso 5: Mostramos las distancias en ventanas emergentes (popups) cuando haces clic en un país del mapa."
];

let indicePaso = 0;

function mostrarPaso() {
    document.getElementById("explicacion").innerText = pasos[indicePaso];
}

document.getElementById("prev").addEventListener("click", () => {
    if (indicePaso > 0) {
        indicePaso--;
        mostrarPaso();
    }
});

document.getElementById("next").addEventListener("click", () => {
    if (indicePaso < pasos.length - 1) {
        indicePaso++;
        mostrarPaso();
    }
});

// Mostrar el primer paso
mostrarPaso();

