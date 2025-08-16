document.addEventListener('DOMContentLoaded', () => { 
  // Centro por defecto: Bogotá
  const initialCenter = [4.6097, -74.0817];

  // Crear mapa
  const map = L.map('map', { center: initialCenter, zoom: 13 });

  // Base OSM con tinte morado (la clase se tiñe en CSS)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
    className: 'purple-tiles'
  }).addTo(map);

  // ===== Helpers =====
  function escapeHtml(s){
    return String(s ?? '').replace(/[&<>"']/g, m => (
      {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]
    ));
  }
  function getTitulo(p){ return p?.NOMBRE_PAR ?? p?.nombre ?? p?.name ?? p?.titulo ?? 'Parque'; }
  function getTipo(p){   return p?.TIPOPARQUE ?? p?.tipo_parque ?? p?.tipo ?? p?.categoria ?? '—'; }

  function parseNumber(val){
    if (val == null) return null;
    if (typeof val === 'number') return isFinite(val) ? val : null;
    let s = String(val).trim().replace(/[^\d.,-]/g, '');
    if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.'); // coma decimal
    s = s.replace(/,/g, ''); // miles
    const n = parseFloat(s);
    return isFinite(n) ? n : null;
  }
  // SHAPE_AREA -> m²
  function getAreaM2(p){
    const v = parseNumber(p?.SHAPE_AREA ?? p?.area_m2 ?? p?.area ?? p?.sup_m2 ?? p?.superficie_m2);
    return v != null ? v : null;
  }
  function fmtArea(m2){
    if (m2 == null) return '—';
    const ha = m2 / 10000;
    return ${m2.toLocaleString('es-CO',{maximumFractionDigits:0})} m² (${ha.toLocaleString('es-CO',{maximumFractionDigits:2})} ha);
  }
  // Slug alternativo por si el archivo no usa el nombre exacto
  function toNameSlug(s){
    return String(s || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .trim().toLowerCase()
      .replace(/\s+/g,'').replace(/[^\w\-]/g,'')
      .replace(/+/g,'').replace(/^|$/g,'');
  }

  // Robustez coord (por si el orden viniera invertido)
  function isLonLat([x, y]) { return Math.abs(x) <= 180 && Math.abs(y) <= 90; }
  function isLatLon([x, y]) { return Math.abs(x) <= 90  && Math.abs(y) <= 180; }
  function mapCoords(geom, fn) {
    const t = geom.type, c = geom.coordinates;
    if (t === 'Point') return { type: t, coordinates: fn(c) };
    if (t === 'MultiPoint' || t === 'LineString') return { type: t, coordinates: c.map(fn) };
    if (t === 'MultiLineString' || t === 'Polygon') return { type: t, coordinates: c.map(r => r.map(fn)) };
    if (t === 'MultiPolygon') return { type: t, coordinates: c.map(p => p.map(r => r.map(fn))) };
    if (t === 'GeometryCollection') return { type: t, geometries: geom.geometries.map(g => mapCoords(g, fn)) };
    return geom;
  }
  function maybeFlipGeoJSON(gj) {
    try {
      const f = gj.features?.[0]; if (!f?.geometry) return gj;
      let sample = null;
      const take = (g) => {
        const t = g.type, c = g.coordinates;
        if (t === 'Point') sample = c;
        else if (t === 'MultiPoint' || t === 'LineString') sample = c[0];
        else if (t === 'Polygon' || t === 'MultiLineString') sample = c[0][0];
        else if (t === 'MultiPolygon') sample = c[0][0][0];
        else if (t === 'GeometryCollection' && g.geometries?.length) take(g.geometries[0]);
      };
      take(f.geometry);
      if (!sample || sample.length < 2) return gj;
      if (isLatLon(sample) && !isLonLat(sample)) {
        console.warn('Detectado posible [lat,lon]. Se invierte a [lon,lat].');
        return {
          type: 'FeatureCollection',
          features: gj.features.map(feat => ({
            ...feat,
            geometry: mapCoords(feat.geometry, ([a, b, ...rest]) => [b, a, ...rest])
          }))
        };
      }
      return gj;
    } catch { return gj; }
  }
  function safeFitToLayer(lyr, fallbackCenter = initialCenter, fallbackZoom = 13) {
    try {
      const b = lyr.get