// --- Configuración inicial del mapa ---
const map = L.map('map').setView([4.65, -74.07], 13);

// Cargar la capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// --- Carga de la ruta GPX ---
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

// --- Marcadores con imágenes y descripciones ---
// Icono personalizado para los marcadores con fotos
const fotoIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3676/3676137.png',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
});

// Arreglo de objetos con coordenadas, imágenes y descripciones
const puntosConImagenes = [
    { 
        coords: [4.6263707764005995, -74.06579541755313], 
        img: 'imagenes/3.jpg', 
        descripcion: 'Parque Nacional de Bogotá. Un lugar para la tranquilidad y el deporte.' 
    },
    { 
        coords: [4.626355240855779, -74.06610416239698], 
        img: 'imagenes/4.jpg', 
        descripcion: 'Árbol centenario. Un punto de referencia en el camino.' 
    },
    { 
        coords: [4.627148948117714, -74.06669193538633], 
        img: 'imagenes/5.jpg', 
        descripcion: 'Edificio de arquitectura moderna. Contrasta con la naturaleza del parque.' 
    },
    { 
        coords: [4.628354261100866, -74.06699934709933], 
        img: 'imagenes/6.jpg', 
        descripcion: 'Camino adoquinado con vistas a la montaña. Perfecto para una caminata.' 
    },
    { 
        coords: [4.628718708907458, -74.0669244953336], 
        img: 'imagenes/7.jpg', 
        descripcion: 'Una fuente de agua con arte local. Un lugar popular para los transeúntes.' 
    },
    { 
        coords: [4.6288147177431895, -74.06634875219639], 
        img: 'imagenes/8.jpg', 
        descripcion: 'Cerca del teatro, un lugar culturalmente vibrante.' 
    }
];

// Recorrer el arreglo y agregar los marcadores al mapa
puntosConImagenes.forEach(punto => {
    if (punto.coords) {
        const marker = L.marker(punto.coords, { icon: fotoIcon }).addTo(map);
        marker.bindPopup(`
            <div style="text-align: center;">
                <img src="${punto.img}" alt="Foto de la ruta" style="width:250px; border-radius:8px;">
                <p style="margin-top: 10px;">${punto.descripcion}</p>
            </div>
        `);
    }
});