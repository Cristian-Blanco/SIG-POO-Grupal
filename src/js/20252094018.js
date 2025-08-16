// ===== Datos base =====
const START = { lat: 4.7110, lng: -74.0721 }; // Bogotá
let map; let baseLayers={}; let shapes={}; let clickHandlerOn=false; let mainMarker;

const steps = [
  {
    title: "Crear el mapa (L.map)",
    bullets: ["Prepara el contenedor #map.","Fija centro y zoom inicial."],
    code: `// 1) Crear el mapa
const map = L.map('map', {
  center: [${START.lat}, ${START.lng}],
  zoom: 12
});`,
    img: "img/paso1-mapa.svg",
    caption: "El contenedor #map y la instancia L.map",
    apply: () => initMap()
  },
  {
    title: "Añadir capa base (L.tileLayer)",
    bullets: ["Usa OpenStreetMap para las teselas.","Configura maxZoom y attribution."],
    code: `// 2) Capa base OpenStreetMap
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);`,
    img: "img/paso2-osm.svg",
    caption: "Teselas OSM como fondo del mapa",
    apply: () => {
      const osm = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom:19, attribution:'&copy; OpenStreetMap contributors' }
      ).addTo(map);
      baseLayers['OSM'] = osm;
    }
  },
  {
    title: "Colocar un marcador (L.marker)",
    bullets: ["Añade un punto representativo.","Vincula un popup con información."],
    code: `// 3) Marcador con popup
const marker = L.marker([${START.lat}, ${START.lng}]).addTo(map);
marker.bindPopup('<b>¡Hola Leaflet!</b><br>Bogotá, CO').openPopup();`,
    img: "img/paso3-marcador.svg",
    caption: "Marcador con popup en el centro",
    apply: () => {
      mainMarker = L.marker([START.lat, START.lng]).addTo(map);
      mainMarker.bindPopup('<b>¡Hola Leaflet!</b><br>Bogotá, CO').openPopup();
    }
  },
  {
    title: "Dibujar formas (L.circle, L.polyline)",
    bullets: ["Círculo con radio en metros.","Polilínea para simular una ruta.","Ajusta la vista a la geometría."],
    code: `// 4) Círculo y Polilínea
const circle = L.circle([${START.lat}, ${START.lng}], { radius: 800 }).addTo(map);
const line = L.polyline([
  [${START.lat}, ${START.lng}],
  [${(START.lat + 0.04).toFixed(4)}, ${(START.lng - 0.06).toFixed(4)}]
]).addTo(map);
map.fitBounds(line.getBounds());`,
    img: "img/paso4-formas.svg",
    caption: "Formas básicas sobre el mapa",
    apply: () => {
      shapes.circle = L.circle([START.lat, START.lng], { radius:800 }).addTo(map);
      shapes.line = L.polyline(
        [[START.lat, START.lng],[START.lat + 0.04, START.lng - 0.06]]
      ).addTo(map);
      map.fitBounds(shapes.line.getBounds());
    }
  },
  {
    title: "Controles: capas y escala",
    bullets: ["Base alternativa (Carto Light).","Control de capas y escala cartográfica."],
    code: `// 5) Controles con Carto
const carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  maxZoom: 20, attribution: '&copy; OpenStreetMap &copy; CARTO'
});
L.control.layers(
  { 'OSM': osm, 'Carto Light': carto },
  { 'Círculo': circle, 'Ruta': line }
).addTo(map);
L.control.scale().addTo(map);`,
    img: "img/paso5-controles.svg",
    caption: "Intercambia bases (OSM/Carto) y muestra la escala",
    apply: () => {
      const carto = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        { maxZoom:20, attribution:'&copy; OpenStreetMap &copy; CARTO' }
      );
      baseLayers['Carto Light'] = carto;

      const overlays = {};
      if (shapes.circle) overlays['Círculo'] = shapes.circle;
      if (shapes.line) overlays['Ruta'] = shapes.line;

      L.control.layers(baseLayers, overlays).addTo(map);
      L.control.scale().addTo(map);
    }
  },
  {
    title: "Interacción: clic para agregar marcadores",
    bullets: ["Escucha eventos de clic en el mapa.","Crea marcadores y popups dinámicos."],
    code: `// 6) Interacción de clic
map.on('click', (e) => {
  L.marker(e.latlng)
   .addTo(map)
   .bindPopup(\`Nuevo punto: \${e.latlng.lat.toFixed(5)}, \${e.latlng.lng.toFixed(5)}\`);
});`,
    img: "img/paso6-interaccion.svg",
    caption: "Añade puntos con un clic",
    apply: () => {
      if (!clickHandlerOn) {
        map.on('click', (e) => {
          L.marker(e.latlng)
            .addTo(map)
            .bindPopup(`Nuevo punto: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`);
        });
        clickHandlerOn = true;
      }
    }
  },
  {
    title: "Consejos de producción y siguientes pasos",
    bullets: [
      "Carga GeoJSON con L.geoJSON(...) y estilos.",
      "Para muchos puntos, usa Leaflet.markercluster.",
      "Reutiliza una sola instancia y desuscribe eventos al limpiar.",
      "Revisa licencias y límites de teselas."
    ],
    code: `// 7) Tips
// - Carga GeoJSON con L.geoJSON(...).
// - Usa clustering para miles de marcadores.
// - Controla rendimiento (re-usa capas, desuscribe eventos).`,
    img: "img/paso7-tips.svg",
    caption: "Buenas prácticas para producción",
    apply: () => {}
  }
];

// ===== Utilidades =====
function initMap(){
  if (map){ map.remove(); }
  map = L.map('map', { center:[START.lat, START.lng], zoom:12 });
  baseLayers = {}; shapes = {}; clickHandlerOn = false; mainMarker = null;
}

function renderUpTo(index){
  initMap();
  for (let i=0;i<=index;i++){ steps[i].apply(); }
  document.getElementById('mapBanner').textContent = `Paso ${index+1}: ${steps[index].title}`;
  const pct = ((index+1)/steps.length)*100;
  document.getElementById('progressBar').style.width = pct + '%';
}

function updateSlide(index){
  const step = steps[index];
  document.getElementById('chipStep').textContent = index+1;
  document.getElementById('chipTotal').textContent = steps.length;
  document.getElementById('slideTitle').textContent = step.title;

  const ul = document.getElementById('slideBullets');
  ul.innerHTML = '';
  step.bullets.forEach(b => {
    const li = document.createElement('li'); li.textContent = b; ul.appendChild(li);
  });

  const stepImage = document.getElementById('stepImage');
  const imgCaption = document.getElementById('imgCaption');
  if(step.img){
    stepImage.src = step.img;
    stepImage.alt = "Imagen de referencia: " + step.title;
    imgCaption.textContent = step.caption || "";
  } else {
    stepImage.removeAttribute('src');
    stepImage.alt = "";
    imgCaption.textContent = "";
  }

  document.getElementById('codeSnippet').textContent = step.code;
  document.getElementById('counter').textContent = `${index+1} / ${steps.length}`;
  prevBtn.disabled = index === 0;
  nextBtn.textContent = index === steps.length - 1 ? 'Reiniciar' : 'Siguiente ⟶';
}

// ===== Navegación y atajos =====
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let current = 0;
function goTo(i){
  if (i < 0) i = 0;
  if (i > steps.length - 1) i = steps.length - 1;
  current = i;
  renderUpTo(current);
  updateSlide(current);
}

prevBtn.addEventListener('click', () => goTo(current-1));
nextBtn.addEventListener('click', () => {
  if (current === steps.length - 1) { goTo(0); return; }
  goTo(current+1);
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'Enter' || e.code === 'Space'){
    e.preventDefault(); nextBtn.click();
  } else if (e.key === 'ArrowLeft'){
    e.preventDefault(); prevBtn.click();
  } else if (e.key.toLowerCase() === 'f'){
    const app = document.getElementById('app');
    if (!document.fullscreenElement){ app.requestFullscreen?.(); }
    else { document.exitFullscreen?.(); }
  } else if (e.key.toLowerCase() === 'c'){
    const box = document.getElementById('codeBox');
    box.open = !box.open;
  }
});

window.addEventListener('load', () => goTo(0));
