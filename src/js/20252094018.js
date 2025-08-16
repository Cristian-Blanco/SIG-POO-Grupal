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
  // 0: Crear mapa
  () => {
    map = L.map('map', { center: [START.lat, START.lng], zoom: 12 });
    updateCode(0);
  },
  // 1: Añadir tileLayer OSM
  () => {
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    baseLayers['OSM'] = osm;
    updateCode(1);
  },
  // 2: Marcador con popup
  () => {
    marker = L.marker([START.lat, START.lng]).addTo(map);
    marker.bindPopup('<b>¡Hola Leaflet!</b><br>Bogotá, CO').openPopup();
    updateCode(2);
  },
  // 3: Formas: círculo y línea
  () => {
    const circle = L.circle([START.lat, START.lng], { radius: 800 }).addTo(map);
    const line = L.polyline([[START.lat, START.lng], [START.lat + 0.04, START.lng - 0.06]]).addTo(map);
    shapes.circle = circle;
    shapes.line = line;
    map.fitBounds(line.getBounds());
    updateCode(3);
  },
  // 4: Controles (capas + escala)
  () => {
    const toner = L.tileLayer('https://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {
      maxZoom: 20,
      attribution: 'Map tiles by Stamen, Data by OpenStreetMap'
    });
    baseLayers['Stamen Toner'] = toner;

    overlays['Círculo'] = shapes.circle || null;
    overlays['Ruta'] = shapes.line || null;

    // Filtrar nulos por si el usuario salta pasos
    const cleanOverlays = Object.fromEntries(Object.entries(overlays).filter(([,v]) => !!v));

    L.control.layers(baseLayers, cleanOverlays).addTo(map);
    L.control.scale().addTo(map);
    updateCode(4);
  },
  // 5: Click para añadir marcadores
  () => {
    if (!clickHandlerOn) {
      map.on('click', (e) => {
        L.marker(e.latlng)
          .addTo(map)
          .bindPopup(`Nuevo punto: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`);
      });
      clickHandlerOn = true;
    }
    updateCode(5);
  },
  // 6: Consejos finales (no muta mapa)
  () => {
    updateCode(6);
  }
];

// Utilidades UI
const stepsList = document.getElementById('stepsList');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const counter = document.getElementById('stepCounter');
const codeBlock = document.getElementById('codeBlock');

let current = 0;

function updateCode(i) {
  codeBlock.textContent = snippets[i];
}

function setActiveStep(i) {
  [...stepsList.children].forEach(li => li.classList.remove('active'));
  const li = stepsList.querySelector(`[data-step="${i}"]`);
  if (li) li.classList.add('active');

  prevBtn.disabled = i === 0;
  nextBtn.textContent = i === steps.length - 1 ? 'Reiniciar' : 'Siguiente ⟶';
  counter.textContent = `${i + 1} / ${steps.length}`;
}

function runStep(i) {
  // Si reinician al final, recarga para limpiar estado
  if (i >= steps.length) {
    window.location.reload();
    return;
  }
  // Ejecuta el paso (idempotente básico)
  steps[i]?.();
  setActiveStep(i);
}

// Click en elementos de la lista para saltar a un paso
stepsList.addEventListener('click', (e) => {
  const li = e.target.closest('li[data-step]');
  if (!li) return;
  const i = Number(li.getAttribute('data-step'));
  current = i;
  runStep(current);
});

// Navegación
prevBtn.addEventListener('click', () => {
  current = Math.max(0, current - 1);
  runStep(current);
});
nextBtn.addEventListener('click', () => {
  if (current === steps.length - 1) {
    // Botón dice "Reiniciar"
    window.location.reload();
  } else {
    current = Math.min(steps.length - 1, current + 1);
    runStep(current);
  }
});

// Inicializa el paso 0 al cargar
window.addEventListener('load', () => {
  runStep(0);
});
