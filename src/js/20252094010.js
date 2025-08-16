/* 20252094010.js
   Port del notebook a navegador con:
   - Leaflet para mapa
   - Turf.js para geoprocesamiento
   - MarkerCluster para agrupar puntos
   Incluye un “stepper” que marca 8 pasos del flujo.
*/

/* ============================
   0) Configuración de fuentes
   ============================ */
const URL_LOCALIDADES =
  "https://datosabiertos.bogota.gov.co/dataset/856cb657-8ca3-4ee8-857f-37211173b1f8/resource/497b8756-0927-4aee-8da9-ca4e32ca3a8a/download/loca.geojson";

const RUTAS_CANDIDATOS = [
  // Añadimos outSR=4326 para asegurar WGS84
  "https://gis.transmilenio.gov.co/arcgis/rest/services/Tecnica/Consulta_Informacion_Geografica_STS/FeatureServer/15/query?where=1%3D1&outFields=*&f=geojson&outSR=4326",
  "https://gis.transmilenio.gov.co/arcgis/rest/services/prueba_publicacion_servicio_zonal/MapServer/1/query?where=1%3D1&outFields=*&f=geojson&outSR=4326",
  "https://gis.transmilenio.gov.co/arcgis/rest/services/Zonal/consulta_rutas_zonales/MapServer/0/query?where=1%3D1&outFields=*&f=geojson&outSR=4326",
];

const STATIONS_CANDIDATES = [
  "https://gis.transmilenio.gov.co/arcgis/rest/services/Troncal/consulta_estaciones_troncales/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson&outSR=4326",
  "https://gis.transmilenio.gov.co/arcgis/rest/services/Zonal/consulta_paraderos_zonales/MapServer/0/query?where=1%3D1&outFields=*&f=geojson&outSR=4326",
];

/* Candidatos de campos (equivalente a pick_field) */
const CAND_LOC_NAMES = ["nom_loc","nombre","localidad","LocNombre","NOMBRE","NOM_LOC"];
const CAND_RUTA_ID = [
  "route_name_ruta_zonal","denominacion_ruta_zonal","codigo_definitivo_ruta_zonal",
  "abrevia","nombre","ruta","id_ruta","descripcion","codigo","ruta_zonal"
];
const CAND_EST_NAME = [
  "nombre_estacion","nombre_paradero","nom_estacion","nom_paradero",
  "nombre","estacion","paradero","name"
];

/* ============================
   1) UI helpers y logging
   ============================ */
const logbox = document.getElementById("logbox");
function log(msg, type="info"){
  const tag = type === "ok" ? "✔" : (type === "warn" ? "⚠" : (type === "err" ? "✖" : "•"));
  logbox.textContent += `\n${tag} ${msg}`;
  logbox.scrollTop = logbox.scrollHeight;
}

/* Stepper */
function markStepDone(id){
  const el = document.getElementById(id);
  if(el) el.classList.add("done");
}

/* Métricas */
const mRutasTouch = document.getElementById("m_rutas_touch");
const mTramosClip  = document.getElementById("m_tramos_clip");
const mKmTotal     = document.getElementById("m_km_total");
const mPts         = document.getElementById("m_pts");

/* ============================
   2) Utilitarios de datos
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
function pickFieldFromFC(featureCollection, candidates){
  if(!featureCollection || !Array.isArray(featureCollection.features)) return null;
  for(const f of featureCollection.features){
    const key = pickFieldFromFeature(f, candidates);
    if(key) return key;
  }
  return null;
}
async function fetchGeoJSON(url){
  const resp = await fetch(url, {mode:"cors"});
  if(!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const gj = await resp.json();
  if(!gj || gj.type !== "FeatureCollection" || !Array.isArray(gj.features)){
    throw new Error("Respuesta no es FeatureCollection GeoJSON");
  }
  return gj;
}
async function fetchFirstAvailable(urls, geomTypes=null, label="capa"){
  let lastErr = null;
  for(const url of urls){
    try{
      log(`Intentando cargar ${label}: ${url}`);
      const gj = await fetchGeoJSON(url);
      const feats = !geomTypes ? gj.features : gj.features.filter(f =>
        !!f.geometry && geomTypes.includes(f.geometry.type)
      );
      if(feats.length === 0){
        log(`Sin geometrías ${geomTypes || ""} en: ${url}`, "warn");
        continue;
      }
      const filteredFC = { type: "FeatureCollection", features: feats };
      log(`OK ${label}: ${feats.length} features | ${url}`, "ok");
      return {fc: filteredFC, url};
    }catch(e){
      lastErr = e;
      log(`Error cargando ${label} en ${url}: ${e.message}`, "warn");
      continue;
    }
  }
  throw new Error(`No fue posible cargar ${label}. Último error: ${lastErr?.message}`);
}
function explodeToLineStrings(feature){
  const out = [];
  if(!feature || !feature.geometry) return out;
  const geom = feature.geometry;
  if(geom.type === "LineString"){
    out.push(feature);
  }else if(geom.type === "MultiLineString"){
    for(const coords of geom.coordinates){
      out.push({
        type: "Feature",
        properties: {...(feature.properties||{})},
        geometry: { type: "LineString", coordinates: coords }
      });
    }
  }
  return out;
}
/* Clip de líneas contra polígono usando border + lineSplit + filtro por punto medio */
function clipLineByPolygon(lineFeature, polygon){
  const border = turf.polygonToLine(polygon);
  let clippedSegments = [];
  const lines = explodeToLineStrings(lineFeature);
  for(const line of lines){
    let segmentsFC;
    try{
      segmentsFC = turf.lineSplit(line, border);
    }catch(e){
      segmentsFC = { type:"FeatureCollection", features:[line] }; // si falla, chequeamos la línea completa
    }
    for(const seg of segmentsFC.features){
      const len = turf.length(seg, {units:"kilometers"});
      const mid = turf.along(seg, len/2, {units:"kilometers"});
      if(turf.booleanPointInPolygon(mid, polygon, {ignoreBoundary:false})){
        clippedSegments.push(seg);
      }
    }
  }
  return clippedSegments;
}
function sumLengthKm(features){
  let total = 0;
  for(const f of features){
    total += turf.length(f, {units:"kilometers"});
  }
  return total;
}

/* ============================
   3) Mapa y capas
   ============================ */
const map = L.map("map", { zoomControl:true, preferCanvas:true });
const base = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const layers = { suba:null, rutasClip:null, pts:null };
const clusters = L.markerClusterGroup({ disableClusteringAtZoom: 16 });

/* ============================
   4) Flujo principal (8 pasos)
   ============================ */
(async function main(){
  try{
    // PASO 1: Cargar Localidades
    log("Cargando Localidades Bogotá…");
    const gLoc = await fetchGeoJSON(URL_LOCALIDADES);
    markStepDone("s1");

    // Detectar campo nombre y filtrar SUBA
    const locNameKey = pickFieldFromFC(gLoc, CAND_LOC_NAMES);
    if(!locNameKey) throw new Error("No se encontró columna de nombre de localidad.");

    const featsSUBA = gLoc.features.filter(f =>
      String(f.properties[locNameKey] ?? "").trim().toUpperCase() === "SUBA"
    );
    if(featsSUBA.length === 0) throw new Error("SUBA no encontrada en Localidades.");

    // PASO 2: Unificar SUBA
    log(`Unificando ${featsSUBA.length} polígonos de SUBA…`);
    let subaPoly = featsSUBA[0];
    for(let i=1;i<featsSUBA.length;i++){
      subaPoly = turf.union(subaPoly, featsSUBA[i]);
    }
    layers.suba = L.geoJSON(subaPoly, {
      style: { color:"#238b45", weight:2, fillColor:"#74c476", fillOpacity:.15 }
    }).addTo(map);
    map.fitBounds(layers.suba.getBounds(), {padding:[20,20]});
    markStepDone("s2");

    // PASO 3: Cargar Rutas
    const {fc: rutasRaw, url: urlRutasUsada} =
      await fetchFirstAvailable(RUTAS_CANDIDATOS, ["LineString","MultiLineString"], "RUTAS");
    log(`Fuente de Rutas usada:\n${urlRutasUsada}`, "ok");
    const rutaIdKey = pickFieldFromFC(rutasRaw, CAND_RUTA_ID) ?? null;
    if(!rutaIdKey) log("No se encontró columna ID/Nombre de ruta.", "warn");
    else log(`Campo de ruta: ${rutaIdKey}`, "ok");
    markStepDone("s3");

    // PASO 4: Intersectar con SUBA
    const rutasTouch = [];
    for(const f of rutasRaw.features){
      try{ if(turf.booleanIntersects(f, subaPoly)) rutasTouch.push(f); }catch{}
    }
    mRutasTouch.textContent = rutasTouch.length;
    log(`Rutas que tocan/intersectan SUBA: ${rutasTouch.length}`);
    markStepDone("s4");

    // PASO 5: Clip + longitudes
    log("Calculando clip de rutas a SUBA…");
    const clippedSegs = [];
    for(const r of rutasTouch){
      const segs = clipLineByPolygon(r, subaPoly);
      for(const s of segs){
        s.properties = { ...(r.properties||{}) };
        clippedSegs.push(s);
      }
    }
    mTramosClip.textContent = clippedSegs.length;
    const kmTotal = sumLengthKm(clippedSegs);
    mKmTotal.textContent = kmTotal.toFixed(3);

    layers.rutasClip = L.geoJSON({type:"FeatureCollection", features: clippedSegs},{
      style: { color:"#1f78b4", weight:3, opacity:.9 },
      onEachFeature: (feat, layer) => {
        if(rutaIdKey){
          const val = feat.properties?.[rutaIdKey];
          const km  = turf.length(feat, {units:"kilometers"});
          layer.bindTooltip(`<b>Ruta:</b> ${val ?? "s/d"}<br><b>Long. tramo:</b> ${km.toFixed(3)} km`);
        }
      }
    }).addTo(map);
    log(`Tramos dentro de SUBA: ${clippedSegs.length} | Longitud total: ${kmTotal.toFixed(3)} km`, "ok");
    markStepDone("s5");

    // PASO 6: Cargar Paraderos/Estaciones
    const {fc: ptsRaw, url: urlPtsUsada} =
      await fetchFirstAvailable(STATIONS_CANDIDATES, ["Point","MultiPoint"], "ESTACIONES/PARADEROS");
    log(`Fuente de Estaciones/Paraderos usada:\n${urlPtsUsada}`, "ok");
    const estNameKey = pickFieldFromFC(ptsRaw, CAND_EST_NAME) ?? null;
    if(!estNameKey) log("No se encontró columna de nombre para estaciones/paraderos.", "warn");
    else log(`Campo de nombre de estación/paradero: ${estNameKey}`, "ok");
    markStepDone("s6");

    // PASO 7: Filtrar puntos dentro de SUBA
    const ptsIn = [];
    for(const p of ptsRaw.features){
      const g = p.geometry;
      if(!g) continue;
      if(g.type === "Point"){
        if(turf.booleanPointInPolygon(p, subaPoly, {ignoreBoundary:false})) ptsIn.push(p);
      }else if(g.type === "MultiPoint"){
        for(const coords of g.coordinates){
          const pt = {type:"Feature", properties:{...(p.properties||{})}, geometry:{type:"Point", coordinates:coords}};
          if(turf.booleanPointInPolygon(pt, subaPoly, {ignoreBoundary:false})) ptsIn.push(pt);
        }
      }
    }
    mPts.textContent = ptsIn.length;
    log(`Puntos dentro/tocando SUBA: ${ptsIn.length}`, "ok");
    markStepDone("s7");

    // PASO 8: Pintar puntos + controles
    ptsIn.forEach(p => {
      const [lon, lat] = p.geometry.coordinates;
      const name = estNameKey ? (p.properties?.[estNameKey] ?? "Estación/Paradero") : "Estación/Paradero";
      const marker = L.marker([lat, lon], { title: String(name) });
      marker.bindPopup(`<b>${name}</b>`);
      clusters.addLayer(marker);
    });
    layers.pts = clusters.addTo(map);

    L.control.layers(
      { "OpenStreetMap": base },
      {
        "Localidad: SUBA": layers.suba,
        "Rutas SITP (tramos dentro de SUBA)": layers.rutasClip,
        "Estaciones/Paraderos en SUBA": layers.pts
      },
      { collapsed:false }
    ).addTo(map);

    log("Listo. Capas pintadas, métricas calculadas, pasos completados.", "ok");
    markStepDone("s8");

  }catch(err){
    log(`ERROR: ${err.message}`, "err");
    alert(`No se pudo inicializar la app.\nDetalle: ${err.message}`);
  }
})();
