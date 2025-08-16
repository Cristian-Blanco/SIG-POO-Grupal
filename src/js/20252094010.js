/* 20252094010.js
   Troncales (líneas) + estaciones (puntos) de TransMilenio dentro de SUBA.
   - Descarga Localidades → filtra SUBA
   - Descarga trazados troncales → intersecta → clip a SUBA
   - Descarga estaciones troncales → filtra dentro de SUBA
   - Muestra métricas y log
*/

/* ============================
   0) Endpoints (GeoJSON)
   ============================ */
const URL_LOCALIDADES =
  "https://datosabiertos.bogota.gov.co/dataset/856cb657-8ca3-4ee8-857f-37211173b1f8/resource/497b8756-0927-4aee-8da9-ca4e32ca3a8a/download/loca.geojson";

/* Trazados troncales (líneas) – candidatos */
const TRONCALES_URLS = [
  "https://gis.transmilenio.gov.co/arcgis/rest/services/Troncal/consulta_trazados_troncales/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson&outSR=4326",
  "https://gis.transmilenio.gov.co/arcgis/rest/services/Troncal/consulta_trazados_troncales/MapServer/0/query?where=1%3D1&outFields=*&f=geojson&outSR=4326"
];

/* Estaciones troncales (puntos) – candidatos */
const ESTACIONES_TRONCAL_URLS = [
  "https://gis.transmilenio.gov.co/arcgis/rest/services/Troncal/consulta_estaciones_troncales/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson&outSR=4326",
  "https://gis.transmilenio.gov.co/arcgis/rest/services/Troncal/consulta_estaciones_troncales/MapServer/0/query?where=1%3D1&outFields=*&f=geojson&outSR=4326"
];

/* Candidatos de nombres de columna para tooltips */
const CAND_LOC_NAMES = ["nom_loc","nombre","localidad","LocNombre","NOMBRE","NOM_LOC"];
const CAND_TRONCAL_ID = ["nombre_troncal","nom_troncal","troncal","corredor","nombre","linea","tramo","nombre_tramo"];
const CAND_EST_NAME   = ["nombre_estacion","nom_estacion","estacion","nombre","name"];

/* ============================
   1) UI & Métricas
   ============================ */
const logbox = document.getElementById("logbox");
function log(msg, type="info"){
  const tag = type === "ok" ? "✔" : (type === "warn" ? "⚠" : (type === "err" ? "✖" : "•"));
  logbox.textContent += `\n${tag} ${msg}`;
  logbox.scrollTop = logbox.scrollHeight;
}
const mLinesTouch = document.getElementById("m_lines_touch");
const mTramosClip = document.getElementById("m_tramos_clip");
const mKmTotal    = document.getElementById("m_km_total");
const mPts        = document.getElementById("m_pts");

/* ============================
   2) Utilidades de datos
   ============================ */
function pickFieldFromFeature(feature, candidates){
  if(!feature || !feature.properties) return null;
  const keys = Object.keys(feature.properties);
  const lower = new Map(keys.map(k => [k.toLowerCase(), k]));
  for(const cand of candidates){
    const found = lower.get(cand.toLowerCase());
    if(found) return found;
  }
  return null;
}
function pickFieldFromFC(fc, candidates){
  if(!fc || !Array.isArray(fc.features)) return null;
  for(const f of fc.features){
    const key = pickFieldFromFeature(f, candidates);
    if(key) return key;
  }
  return null;
}
async function fetchGeoJSON(url){
  const r = await fetch(url, {mode:"cors"});
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  const gj = await r.json();
  if(!gj || gj.type!=="FeatureCollection" || !Array.isArray(gj.features)) {
    throw new Error("Respuesta no es FeatureCollection GeoJSON");
  }
  return gj;
}
async function fetchFirstAvailable(urls, geomTypes=null, label="capa"){
  let lastErr = null;
  for(const url of urls){
    try{
      log(`Intentando ${label}: ${url}`);
      const gj = await fetchGeoJSON(url);
      const feats = !geomTypes ? gj.features : gj.features.filter(f =>
        !!f.geometry && geomTypes.includes(f.geometry.type)
      );
      if(feats.length === 0){
        log(`Sin geometrías ${geomTypes || ""} en: ${url}`, "warn");
        continue;
      }
      log(`OK ${label}: ${feats.length} features`, "ok");
      return { fc: {type:"FeatureCollection", features:feats}, url };
    }catch(e){
      lastErr = e;
      log(`Error ${label} ${url}: ${e.message}`, "warn");
    }
  }
  throw new Error(`No se pudo cargar ${label}. Último error: ${lastErr?.message}`);
}
function explodeToLineStrings(feature){
  const out = [];
  if(!feature || !feature.geometry) return out;
  const g = feature.geometry;
  if(g.type === "LineString"){
    out.push(feature);
  }else if(g.type === "MultiLineString"){
    for(const coords of g.coordinates){
      out.push({ type:"Feature", properties:{...(feature.properties||{})}, geometry:{type:"LineString", coordinates:coords} });
    }
  }
  return out;
}
/* Clip de líneas contra polígono: border + lineSplit + punto medio dentro */
function clipLineByPolygon(lineFeature, polygon){
  const border = turf.polygonToLine(polygon);
  const clipped = [];
  const lines = explodeToLineStrings(lineFeature);
  for(const line of lines){
    let segmentsFC;
    try{ segmentsFC = turf.lineSplit(line, border); }
    catch{ segmentsFC = { type:"FeatureCollection", features:[line] }; }
    for(const seg of segmentsFC.features){
      const len = turf.length(seg, {units:"kilometers"});
      const mid = turf.along(seg, len/2, {units:"kilometers"});
      if(turf.booleanPointInPolygon(mid, polygon, {ignoreBoundary:false})) clipped.push(seg);
    }
  }
  return clipped;
}
function sumLengthKm(features){
  let total=0;
  for(const f of features){ total += turf.length(f, {units:"kilometers"}); }
  return total;
}

/* ============================
   3) Mapa base
   ============================ */
const map = L.map("map", { zoomControl:true, preferCanvas:true });
const base = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const layers = { suba:null, troncalesClip:null, estaciones:null };
const cluster = L.markerClusterGroup({ disableClusteringAtZoom: 16 });

/* ============================
   4) Flujo principal
   ============================ */
(async function main(){
  try{
    // 1) Localidades → SUBA
    log("Cargando Localidades Bogotá…");
    const gLoc = await fetchGeoJSON(URL_LOCALIDADES);
    const locNameKey = pickFieldFromFC(gLoc, CAND_LOC_NAMES);
    if(!locNameKey) throw new Error("No se encontró columna de nombre de localidad.");

    const subaFeats = gLoc.features.filter(f =>
      String(f.properties?.[locNameKey] ?? "").trim().toUpperCase() === "SUBA"
    );
    if(subaFeats.length===0) throw new Error("SUBA no encontrada en Localidades.");
    log(`SUBA: ${subaFeats.length} polígonos → unificar…`);

    let subaPoly = subaFeats[0];
    for(let i=1;i<subaFeats.length;i++){ subaPoly = turf.union(subaPoly, subaFeats[i]); }

    layers.suba = L.geoJSON(subaPoly, {
      style:{ color:"#238b45", weight:2, fillColor:"#74c476", fillOpacity:.15 }
    }).addTo(map);
    map.fitBounds(layers.suba.getBounds(), {padding:[20,20]});

    // 2) Troncales (líneas)
    const { fc: tronRaw, url: urlTron } =
      await fetchFirstAvailable(TRONCALES_URLS, ["LineString","MultiLineString"], "TRONCALES (líneas)");
    log(`Fuente troncales: ${urlTron}`, "ok");

    const troncalIdKey = pickFieldFromFC(tronRaw, CAND_TRONCAL_ID) ?? null;
    if(!troncalIdKey) log("No se detectó columna de nombre/ID de troncal.", "warn");
    else log(`Campo troncal: ${troncalIdKey}`, "ok");

    // Intersección con SUBA
    const linesTouch = [];
    for(const f of tronRaw.features){
      try{ if(turf.booleanIntersects(f, subaPoly)) linesTouch.push(f); }catch{}
    }
    mLinesTouch.textContent = linesTouch.length;
    log(`Troncales que tocan/intersectan SUBA: ${linesTouch.length}`);

    // Clip al interior de SUBA
    const clippedSegs = [];
    for(const ln of linesTouch){
      const segs = clipLineByPolygon(ln, subaPoly);
      for(const s of segs){ s.properties = { ...(ln.properties||{}) }; clippedSegs.push(s); }
    }
    mTramosClip.textContent = clippedSegs.length;
    const kmTotal = sumLengthKm(clippedSegs);
    mKmTotal.textContent = kmTotal.toFixed(3);

    layers.troncalesClip = L.geoJSON({type:"FeatureCollection", features:clippedSegs},{
      style:{ color:"#e53935", weight:4, opacity:.95 },
      onEachFeature:(feat, layer)=>{
        const id = troncalIdKey ? (feat.properties?.[troncalIdKey] ?? "Troncal") : "Troncal";
        const km = turf.length(feat, {units:"kilometers"});
        layer.bindTooltip(`<b>${id}</b><br>Long. tramo: ${km.toFixed(3)} km`);
      }
    }).addTo(map);

    // 3) Estaciones troncales (puntos)
    const { fc: estRaw, url: urlEst } =
      await fetchFirstAvailable(ESTACIONES_TRONCAL_URLS, ["Point","MultiPoint"], "ESTACIONES TRONCALES (puntos)");
    log(`Fuente estaciones: ${urlEst}`, "ok");

    const estNameKey = pickFieldFromFC(estRaw, CAND_EST_NAME) ?? null;
    if(!estNameKey) log("No se detectó columna de nombre de estación.", "warn");
    else log(`Campo estación: ${estNameKey}`, "ok");

    const ptsIn = [];
    for(const p of estRaw.features){
      const g = p.geometry;
      if(!g) continue;
      if(g.type==="Point"){
        if(turf.booleanPointInPolygon(p, subaPoly, {ignoreBoundary:false})) ptsIn.push(p);
      }else if(g.type==="MultiPoint"){
        for(const c of g.coordinates){
          const pt = {type:"Feature", properties:{...(p.properties||{})}, geometry:{type:"Point", coordinates:c}};
          if(turf.booleanPointInPolygon(pt, subaPoly, {ignoreBoundary:false})) ptsIn.push(pt);
        }
      }
    }
    mPts.textContent = ptsIn.length;

    ptsIn.forEach(p=>{
      const [lon, lat] = p.geometry.coordinates;
      const name = estNameKey ? (p.properties?.[estNameKey] ?? "Estación") : "Estación";
      const m = L.marker([lat, lon], { title:String(name) });
      m.bindPopup(`<b>${name}</b>`);
      cluster.addLayer(m);
    });
    layers.estaciones = cluster.addTo(map);

    // Control de capas
    L.control.layers(
      { "OpenStreetMap": base },
      {
        "Localidad: SUBA": layers.suba,
        "Troncales (clip dentro de SUBA)": layers.troncalesClip,
        "Estaciones troncales en SUBA": layers.estaciones
      },
      { collapsed:false }
    ).addTo(map);

    log(`Listo. Tramos dentro de SUBA: ${clippedSegs.length} | Longitud total: ${kmTotal.toFixed(3)} km.`, "ok");

  }catch(err){
    log(`ERROR: ${err.message}`, "err");
    alert(`No se pudo inicializar la app.\nDetalle: ${err.message}`);
  }
})();
