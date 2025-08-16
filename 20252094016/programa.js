// --- Inicialización del mapa ---
const mapa = L.map('mapa').setView([4.518426196790787, -74.11697088763084], 15); // Bogotá

// Capa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 30,
}).addTo(mapa);

// Marcador de subestación (ejemplo en Bogotá)
const marcador = L.marker([4.531206, -74.111714]).addTo(mapa)
  .bindPopup("Subestación de Monitoreo");

// Cargar polígono de barrio
fetch("./Limite_barrio_Marichuela.geojson")
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: { color: "blue", weight: 2, fillOpacity: 0.1 }
    }).addTo(mapa);
  });

// --- Cargar datos históricos ---
fetch("./historico_estaciones.geojson")
  .then(res => res.json())
  .then(data => {
    const fechas = [];
    const co = [];
    const o3 = [];

    data.features.forEach(f => {
      const props = f.properties;
      fechas.push(props.fecha);
      co.push(props.CO);
      o3.push(props.O3);
    });

    // Graficar CO
    new Chart(document.getElementById("graficoCO"), {
      type: 'line',
      data: {
        labels: fechas,
        datasets: [{
          label: 'CO (ppm)',
          data: co,
          borderColor: 'red',
          fill: false
        }]
      }
    });

    // Graficar O3
    new Chart(document.getElementById("graficoO3"), {
      type: 'line',
      data: {
        labels: fechas,
        datasets: [{
          label: 'O3 (µg/m³)',
          data: o3,
          borderColor: 'green',
          fill: false
        }]
      }
    });

    // --- Análisis Estadístico ---
    function calcularEstadisticas(arr) {
      const max = Math.max(...arr);
      const min = Math.min(...arr);
      const promedio = arr.reduce((a, b) => a + b, 0) / arr.length;
      const desviacion = Math.sqrt(arr.map(x => Math.pow(x - promedio, 2)).reduce((a, b) => a + b) / arr.length);
      return { max, min, promedio, desviacion };
    }

    const coStats = calcularEstadisticas(co);
    const o3Stats = calcularEstadisticas(o3);

    document.getElementById("analisis").value =
      "📊 Tendencias y Estadísticas\n\n" +
      "CO:\n" +
      `  - Máximo: ${coStats.max}\n` +
      `  - Mínimo: ${coStats.min}\n` +
      `  - Promedio: ${coStats.promedio.toFixed(2)}\n` +
      `  - Desviación: ${coStats.desviacion.toFixed(2)}\n\n` +
      "O3:\n" +
      `  - Máximo: ${o3Stats.max}\n` +
      `  - Mínimo: ${o3Stats.min}\n` +
      `  - Promedio: ${o3Stats.promedio.toFixed(2)}\n` +
      `  - Desviación: ${o3Stats.desviacion.toFixed(2)}\n`;
  });
