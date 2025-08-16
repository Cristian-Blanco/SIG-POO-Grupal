// Coordenadas de Bogotá
const bogotaCoords = [-74.08175, 4.60971];
const bogota = turf.point(bogotaCoords);

// Crear el mapa
const map = L.map('map').setView([20, 0], 2);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> · © <a href="https://carto.com/">CARTO</a>'
}).addTo(map);

// Agregar marcador fijo en Bogotá
L.marker([bogotaCoords[1], bogotaCoords[0]])
    .addTo(map)
    .bindPopup("<strong>Bogotá</strong><br>Capital de Colombia")
    .openPopup();

// Cargar datos GeoJSON
fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
    .then(res => res.json())
    .then(data => {
        L.geoJSON(data, {
            onEachFeature: function (feature, layer) {
                // Obtener nombre del país evitando undefined
                const nombrePais = feature.properties.ADMIN || feature.properties.name || "País desconocido";

                // Calcular distancia al centroide del país
                const centroid = turf.centroid(feature);
                const distancia = turf.distance(bogota, centroid, { units: 'kilometers' }).toFixed(2);

                // Popup con formato solicitado
                layer.bindPopup(`<strong>Distancia desde Bogotá a ${nombrePais}:</strong><br>${distancia} km`);
            },
            style: {
                color: '#00FFFF',
                weight: 1
            }
        }).addTo(map);
    });
