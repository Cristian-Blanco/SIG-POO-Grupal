document.getElementById('cargarDatosBtn').addEventListener('click', async () => {
  // 1. Solicita datos a la API WFS
  const url = "http://iboca.ambientebogota.gov.co:8080/geoserver/sda_ca/wfs";
  const params = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typeNames: "sda_ca:Hist_ca_aire_estaciones",
    outputFormat: "application/json",
    srsName: "EPSG:4326",
    CQL_FILTER: "fecha_hora BETWEEN '2023-01-01T00:00.00' AND '2023-01-31T23:59.59'"
  });

  const response = await fetch(`${url}?${params.toString()}`);
  const data = await response.json();

  // 2. Procesa los datos GeoJSON
  const features = data.features;
  // Filtra PM10
  const pm10 = features.filter(f => f.properties.contaminante === "PM10");

  // 3. Estadísticas básicas
  const valores = pm10.map(f => f.properties.valor).filter(v => typeof v === 'number');
  const estadisticas = calcularEstadisticas(valores);
  document.getElementById('estadisticas').textContent = JSON.stringify(estadisticas, null, 2);

  // 4. Muestra el mapa con Leaflet
  mostrarMapa(pm10);

  // 5. Histograma con Chart.js
  mostrarHistograma(valores);
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