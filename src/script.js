// script.js

// Inicializar el mapa
const map = L.map('map').setView([40.4168, -3.7038], 13); // Ajusta las coordenadas según tu zona (ej. Madrid)

// Añadir capa base (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Icono personalizado para los marcadores (verde oscuro)
const greenIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Cargar el GeoJSON
fetch('arbalta_parques.geojson')
  .then(response => {
    if (!response.ok) throw new Error('No se pudo cargar el archivo GeoJSON');
    return response.json();
  })
  .then(data => {
    // Añadir los polígonos al mapa
    L.geoJSON(data, {
      style: {
        color: "#3388ff",
        weight: 2,
        fillOpacity: 0.3
      }
    }).addTo(map);

    // Añadir un marcador por cada parque en el centro del polígono
    data.features.forEach(feature => {
      if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
        const nombre = feature.properties.NOMBRE_PAR;

        // Calcular el centro del polígono
        const centroid = L.geoJSON(feature).getBounds().getCenter();

        // Añadir marcador con el nombre
        L.marker(centroid, { icon: greenIcon })
          .bindPopup(<strong>${nombre}</strong>)
          .addTo(map);
      }
    });

    // Ajustar la vista al conjunto de parques
    map.fitBounds(L.geoJSON(data).getBounds());
  })
  .catch(error => {
    console.error('Error al cargar el GeoJSON:', error);
    alert('Error al cargar los datos de los parques.');
  });