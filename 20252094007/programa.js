// Coordenadas Plaza de Bolívar (Bogotá)
const plazaBolivar = [4.5981, -74.0760];

// Inicializar el mapa centrado en Plaza de Bolívar
const map = L.map('map').setView(plazaBolivar, 16);

// Cargar capa base (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Cargar archivo GPX (debe estar en la raíz del proyecto)
const gpxFile = 'ruta.gpx';

new L.GPX(gpxFile, {
    async: true,
    marker_options: {
        startIconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet-gpx/1.7.0/pin-icon-start.png',
        endIconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet-gpx/1.7.0/pin-icon-end.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet-gpx/1.7.0/pin-shadow.png'
    }
}).on('loaded', function(e) {
    map.fitBounds(e.target.getBounds());
}).addTo(map);

// Lista de marcadores con imágenes (sin descripciones)
const puntosConImagenes = [
    { img: 'img_1.jpg', descripcion: '' },
    { img: 'img_2.jpg', descripcion: '' },
    { coords: [4.6263707764005995, -74.06579541755313], img: 'imagenes/3.jpg', descripcion: '' },
    { coords: [4.626355240855779, -74.06610416239698], img: 'imagenes/4.jpg', descripcion: '' },
    { coords: [4.627148948117714, -74.06669193538633], img: 'imagenes/5.jpg', descripcion: '' },
    { coords: [4.628354261100866, -74.06699934709933], img: 'imagenes/6.jpg', descripcion: '' },
    { coords: [4.628718708907458, -74.0669244953336], img: 'imagenes/7.jpg', descripcion: '' },
    { coords: [4.6288147177431895, -74.06634875219639], img: 'imagenes/8.jpg', descripcion: '' }
];

// Agregar marcadores con popups que muestran solo imágenes
puntosConImagenes.forEach(punto => {
    const marker = L.marker(punto.coords).addTo(map);
    marker.bindPopup(`
        <img src="${punto.img}" alt="Foto" style="width:200px; border-radius:8px;">
    `);
});