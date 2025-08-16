// Inicializar el mapa centrado en Engativá (Bogotá)
var map = L.map('map').setView([4.72, -74.12], 13); // Ajusta coordenadas si lo deseas

// Capa base (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Cargar el archivo GeoJSON completo (asegúrate de tenerlo en la carpeta del proyecto)
fetch('arboladourbano.geojson')
  .then(res => res.json())
  .then(data => {
    // Filtrar solo árboles en Engativá, usando el campo "NOM_LOCALIDAD"
    const engativa = data.features.filter(feat =>
      feat.properties.NOM_LOCALIDAD === 'ENGATIVÁ'
    );

    // Crear una nueva GeoJSON con los puntos filtrados
    const geoEngativa = { type: 'FeatureCollection', features: engativa };

    L.geoJSON(geoEngativa, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 5,
          fillColor: "#27ae60",
          color: "#145a32",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        });
      },
      onEachFeature: function (feature, layer) {
        const p = feature.properties;
        layer.bindPopup(
          `<b>Especie:</b> ${p.Nombre_Esp || '—'}<br>` +
          `<b>Altura:</b> ${p.Altura_Total ? p.Altura_Total + ' m' : '—'}<br>` +
          `<b>Localidad:</b> ${p.NOM_LOCALIDAD}`
        );
      }
    }).addTo(map);

    if (engativa.length) {
      const layer = L.geoJSON(geoEngativa);
      map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    } else {
      alert('No se encontraron árboles en Engativá.');
    }
  })
  .catch(err => {
    console.error('Error cargando el GeoJSON completo:', err);
    alert('No fue posible cargar los datos.');
  });
