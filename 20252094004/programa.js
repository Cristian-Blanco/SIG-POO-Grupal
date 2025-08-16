// Coordenadas de Bogotá
const bogota = turf.point([-74.08175, 4.60971]);

// Crear el mapa
const map = L.map('map').setView([4.60971, -74.08175], 2);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> contributors'
}).addTo(map);

// Marcador en Bogotá
L.marker([4.60971, -74.08175]).addTo(map).bindPopup("Bogotá, Colombia").openPopup();

// Cargar GeoJSON de países desde URL
fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
    .then(res => res.json())
    .then(data => {
        L.geoJSON(data, {
            onEachFeature: (feature, layer) => {
                // Calcular distancia en km
                const centroid = turf.centroid(feature);
                const distancia = turf.distance(bogota, centroid, { units: 'kilometers' }).toFixed(2);

                layer.bindPopup(`<strong>${feature.properties.ADMIN}</strong><br>Distancia: ${distancia} km`);
            },
            style: {
                color: "#00FFFF",
                weight: 1
            }
        }).addTo(map);
    });
