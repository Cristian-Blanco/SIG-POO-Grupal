document.getElementById('cargarDatosBtn').addEventListener('click', async () => {
  try {
    const response = await fetch('historico_estaciones.geojson');
    if (!response.ok) throw new Error("No se pudo cargar el archivo GeoJSON local");
    const data = await response.json();

    // Extraer todas las estaciones del GeoJSON
    const features = data.features || [];
    if (features.length === 0) {
      document.getElementById('estadisticas').textContent = "No se encontraron estaciones en el archivo GeoJSON.";
      return;
    }

    document.getElementById('estadisticas').textContent = `Total de estaciones: ${features.length}`;

    mostrarMapaEstaciones(features);
  } catch (err) {
    document.getElementById('estadisticas').textContent = "Error al cargar datos: " + err.message;
    console.error(err);
  }
});

function mostrarMapaEstaciones(estaciones) {
  const mapDiv = document.getElementById('map');
  mapDiv.innerHTML = ""; // Limpia el mapa anterior
  const map = L.map('map').setView([4.65, -74.1], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  estaciones.forEach(f => {
    const coords = f.geometry.coordinates;
    const props = f.properties;
    L.marker([coords[1], coords[0]]).addTo(map)
      .bindPopup(`Estación: ${props.estacion || 'Sin nombre'}`);
  });
}