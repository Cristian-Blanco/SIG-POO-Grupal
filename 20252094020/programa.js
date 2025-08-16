// Visor 3D de construcciones con MapLibre GL (sin token)
// Requiere: arbalta_construcciones.geojson en la misma carpeta.

const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    // Estilo mínimo con una capa raster de OSM por defecto
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contrib.'
      }
    },
    layers: [
      { id: 'osm', type: 'raster', source: 'osm' }
    ],
    // Luz para extrusiones
    light: {
      anchor: 'viewport',
      color: 'white',
      intensity: 0.4
    }
  },
  center: [-74.154, 4.582], // Aproximación a Arborizadora Alta (Bogotá)
  zoom: 14.5,
  pitch: 60,
  bearing: -20,
  antialias: true
});

// Controles básicos
map.addControl(new maplibregl.NavigationControl(), 'top-left');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

// Recentrar
document.getElementById('resetView').addEventListener('click', () => {
  map.easeTo({ center: [-74.154, 4.582], zoom: 14.5, pitch: 60, bearing: -20, duration: 1200 });
});

// Cambiar mapa base (tres fuentes raster sencillas)
const basemapSelect = document.getElementById('basemap');
basemapSelect.addEventListener('change', (e) => {
  const value = e.target.value;
  let tiles, attribution;
  if (value === 'osm') {
    tiles = ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'];
    attribution = '© OpenStreetMap contrib.';
  } else if (value === 'carto') {
    tiles = ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'];
    attribution = '© OpenStreetMap, © CARTO';
  } else {
    tiles = ['https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png'];
    attribution = 'Map tiles by Stamen, Data © OSM';
  }
  map.getSource('osm').setTiles(tiles);
  map.getSource('osm').setAttribution(attribution);
});

// Carga del GeoJSON y creación de extrusiones
map.on('load', async () => {
  const statusEl = document.getElementById('fileStatus');

  try {
    const resp = await fetch('arbalta_construcciones.geojson', { cache: 'no-cache' });
    if (!resp.ok) throw new Error(`No se pudo cargar el archivo (${resp.status})`);
    const data = await resp.json();

    // Añadir fuente
    map.addSource('construcciones', {
      type: 'geojson',
      data,
      promoteId: 'id' // si no existe, no pasa nada
    });

    // Escala dinámica para alturas
    let heightScale = 1.0;
    const scaleInput = document.getElementById('heightScale');
    const scaleLabel = document.getElementById('heightScaleValue');
    scaleInput.addEventListener('input', () => {
      heightScale = parseFloat(scaleInput.value);
      scaleLabel.textContent = `${heightScale.toFixed(1)}×`;
      updateHeights();
    });

    // Expresión para altura y min_height:
    // Busca el primer atributo disponible entre: height, altura, HA, h
    const baseHeightExpr = [
      'coalesce',
      ['get', 'height'],
      ['get', 'altura'],
      ['get', 'HA'],
      ['get', 'h'],
      10 // por defecto 10m si no hay atributo
    ];
    const minHeightExpr = [
      'coalesce',
      ['get', 'min_height'],
      ['get', 'base_height'],
      0
    ];

    const scaledHeightExpr = ['*', baseHeightExpr, ['var', 'hs']];

    // Variable de estilo para escala de altura
    map.setPaintProperty = map.setPaintProperty.bind(map); // fix for some bundlers
    map.addLayer({
      id: 'construcciones-3d',
      type: 'fill-extrusion',
      source: 'construcciones',
      paint: {
        'fill-extrusion-height': scaledHeightExpr,
        'fill-extrusion-base': minHeightExpr,
        'fill-extrusion-opacity': 0.95,
        'fill-extrusion-color': [
          'step',
          baseHeightExpr,
          '#4e79a7', 10,
          '#59a14f', 20,
          '#f28e2b', 30,
          '#e15759', 50,
          '#b07aa1'
        ]
      }
    });

    // Inicializar variable de estilo (escala)
    map.setFilter('construcciones-3d', ['all']); // fuerza evaluación
    map.setPaintProperty('construcciones-3d', 'fill-extrusion-height', ['*', baseHeightExpr, ['var', 'hs']]);
    map.setFilter('construcciones-3d', ['all']); // de nuevo por si acaso
    map.setStyleVariable('hs', 1.0); // define variable hs = 1.0

    function updateHeights(){
      // Actualiza la variable de estilo 'hs'
      map.setStyleVariable('hs', heightScale);
    }

    // Sombreado/resalte al pasar el mouse (borde “brillo”)
    // Creamos una capa de líneas sobre las extrusiones para el hover
    map.addLayer({

