const mapa = L.map('map').setView([4.7110, -74.0721], 13);

// Capa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(mapa);

// Cargar archivo GPX
const gpx = new L.GPX('track.gpx', {
  async: true,
  marker_options: {
    startIconUrl: 'https://unpkg.com/leaflet-gpx@1.5.1/pin-icon-start.png',
    endIconUrl: 'https://unpkg.com/leaflet-gpx@1.5.1/pin-icon-end.png',
    shadowUrl: 'https://unpkg.com/leaflet-gpx@1.5.1/pin-shadow.png',
    wptIconUrls: {
      '': 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png'
    }
  },
  polyline_options: {
    color: 'blue',
    weight: 4,
    opacity: 0.75
  }
})
.on('loaded', function(e) {
  mapa.fitBounds(e.target.getBounds());
})
.on('addpoint', function(e) {
  const point = e.point;
  const marker = e.marker;

  if (!marker) return;

  // Obtener el número del punto del nombre, por ejemplo "Punto 2" -> 2
  const match = (point.name || '').match(/(\d+)/);
  const index = match ? parseInt(match[1]) : null;
  const fotoRuta = index ? `fotos/foto${index}.jpg` : null;

  let popup = `<b>${point.name || 'Punto'}</b>`;
  if (point.desc) popup += `<br>${point.desc}`;
  if (fotoRuta) {
    popup += `<br><img src="${fotoRuta}" style="width:120px; border-radius:8px;">`;
  }

  marker.bindPopup(popup);
})
.addTo(mapa);