// Coordenadas iniciales (Bogotá como ejemplo)
const START = { lat: 4.7110, lng: -74.0721 };
let map;               // instancia L.map
let baseLayers = {};   // para el control de capas
let overlays = {};     // para el control de capas
let marker;            // marcador principal
let shapes = {};       // circle y polyline
let clickHandlerOn = false;

// Fragmentos de código a mostrar en cada paso (solo informativo)
const snippets = [
`// 1) Crear el mapa
const map = L.map('map', {
  center: [${START.lat}, ${START.lng}],
  zoom: 12
});`,

`// 2) Añadir capa base (OpenStreetMap)
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);`,

`// 3) Colocar un marcador con popup
const marker = L.marker([${START.lat}, ${START.lng}]).addTo(map);
marker.bindPopup('<b>¡Hola Leaflet!</b><br>Bogotá, CO').openPopup();`,

`// 4) Dibujar un círculo y una polilínea
const circle = L.circle([${START.lat}, ${START.lng}], {
  radius: 800
}).addTo(map);

const line = L.polyline([
  [${START.lat}, ${START.lng}],
  [${START.lat + 0.04}, ${START.lng - 0.06}]
]).addTo(map);

map.fitBounds(line.getBounds());`,

`// 5) Control de capas y escala
const toner = L.tileLayer('https://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {
  maxZoom: 20,
  attribution: 'Map tiles by Stamen, Data by OpenStreetMap'
});
L.control.layers({ 'OSM': osm, 'Stamen Toner': toner }, { 'Círculo': circle, 'Ruta': line }).addTo(map);
L.control.scale().addTo(map);`,

`// 6) Interacción: click para agregar marcadores
map.on('click', (e) => {
  L.marker(e.latlng).addTo(map).bindPopup(\`Nuevo punto: \${e.latlng.lat.toFixed(5)}, \${e.latlng.lng.toFixed(5)}\`);
});`,

`// 7) Consejos
// - Reutiliza una sola instancia de mapa.
// - Usa tus propias claves/tiles si el proveedor lo requiere.
// - Agrupa muchos marcadores con Leaflet.markercluster.
// - Carga GeoJSON con L.geoJSON(...) y estilos dinámicos.
`
];

// Pasos como funciones que mutan el estado del mapa
const steps = [
  // 0: Crear
