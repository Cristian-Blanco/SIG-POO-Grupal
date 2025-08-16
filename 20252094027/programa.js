document.getElementById('cargarDatosBtn').addEventListener('click', async () => {
  try {
    // Cambia aquí si tu archivo es .geojson
    const response = await fetch('historico_estaciones.geojson');
    if (!response.ok) throw new Error("No se pudo cargar el archivo GeoJSON local");
    const data = await response.json();

    // Extraer las features del GeoJSON
    const features = data.features || [];
    // Filtrar PM10
    const pm10 = features.filter(f => f.properties.contaminante === "PM10");

    const valores = pm10.map(f => f.properties.valor).filter(v => typeof v === 'number' && !isNaN(v));

    if (valores.length === 0) {
      document.getElementById('estadisticas').textContent = "No se encontraron datos PM10 en el archivo GeoJSON.";
      return;
    }

    const estadisticas = calcularEstadisticas(valores);
    document.getElementById('estadisticas').textContent = JSON.stringify(estadisticas, null, 2);

    mostrarMapa(pm10);
    mostrarHistograma(valores);
  } catch (err) {
    document.getElementById('estadisticas').textContent = "Error al cargar datos: " + err.message;
    console.error(err);
  }
});

function calcularEstadisticas(arr) {
  const n = arr.length;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const sorted = [...arr].sort((a, b) => a - b);
  const median = sorted[Math.floor(n / 2)];
  return { count: n, mean, min, max, median };
}

function mostrarMapa(pm10) {
  const mapDiv = document.getElementById('map');
  mapDiv.innerHTML = ""; // Limpia el mapa anterior
  const map = L.map('map').setView([4.65, -74.1], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  pm10.forEach(f => {
    const coords = f.geometry.coordinates;
    L.marker([coords[1], coords[0]]).addTo(map)
      .bindPopup(`Estación: ${f.properties.estacion}<br>Valor: ${f.properties.valor}`);
  });
}

function mostrarHistograma(valores) {
  const ctx = document.getElementById('histograma').getContext('2d');
  // Agrupa valores en bins
  const bins = 20;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const step = (max - min) / bins;
  const hist = Array(bins).fill(0);
  valores.forEach(v => {
    const idx = Math.min(bins - 1, Math.floor((v - min) / step));
    hist[idx]++;
  });
  const labels = Array.from({length: bins}, (_, i) => (min + i * step).toFixed(1));

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'PM10',
        data: hist,
        backgroundColor: 'rgba(54, 162, 235, 0.5)'
      }]
    },
    options: {
      scales: {
        x: { title: { display: true, text: 'Valor PM10' } },
        y: { title: { display: true, text: 'Frecuencia' } }
      }
    }
  });
}