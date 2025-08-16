// Inicializar el mapa
const map = L.map('map').setView([4.60524, -74.07674], 15);

// Capa base OSM
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Estilo del polígono
const estiloPoligono = {
  fillColor: '#09435C',  // relleno
  color: '#031821',      // borde
  weight: 1,
  opacity: 1,
  fillOpacity: 0.5
};

// Cargar el GeoJSON
fetch('Lotes_La_Capuchina.geojson')
  .then(resp => {
    if (!resp.ok) throw new Error('No se pudo cargar el GeoJSON');
    return resp.json();
  })
  .then(data => {
    const layer = L.geoJSON(data, { style: estiloPoligono }).addTo(map);
    const bounds = layer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
  })
  .catch(err => {
    console.error('Error cargando GeoJSON:', err);
    alert('Hubo un problema cargando el polígono. Revisa la consola.');
  });

// === Marcadores ===
const marcador1 = L.marker([4.601882386879739, -74.07840290587482])
  .bindPopup("📍 Marcador 1")
  .addTo(map);

const marcador2 = L.marker([4.604600183830083, -74.07868720364645])
  .bindPopup("📍 Marcador 2")
  .addTo(map);


