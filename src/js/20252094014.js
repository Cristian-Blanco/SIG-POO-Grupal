Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3ZjBjZWNjNi1lN2E2LTQxN2EtOWY2MS0xZjliMjIxMDZmMzUiLCJpZCI6MzMxMzU3LCJpYXQiOjE3NTUwNDI1NTB9.CLqrLXgbk4VfneVH0NK8xmkyEll98A0whFdesGkvMTo';

const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),
  baseLayer: Cesium.ImageryLayer.fromProviderAsync(
    Cesium.ArcGisMapServerImageryProvider.fromBasemapType(
      Cesium.ArcGisBaseMapType.SATELLITE
    )
  ),
  timeline:false, animation:false, shadows:true
});
viewer.scene.globe.depthTestAgainstTerrain = true;

// 1) Carga construcciones (EPSG:4326)
const ds = await Cesium.GeoJsonDataSource.load("src/assets/construcciones.geojson");
await viewer.dataSources.add(ds);

// 2) Función para centrar la cámara
await viewer.zoomTo(ds);

// 3) Anclar cada polígono al terreno y extruir por CONNPISOS*3
const entities = ds.entities.values;

// Pequeño helper para aproximar el centro del polígono
function centroidCartographic(entity) {
  const pos = entity.polygon.hierarchy.getValue().positions;
  const bs = Cesium.BoundingSphere.fromPoints(pos);
  return Cesium.Ellipsoid.WGS84.cartesianToCartographic(bs.center);
}

// Construimos una lista de muestras al terreno
const samples = [];
for (const e of entities) {
  if (!e.polygon) continue;
  const carto = centroidCartographic(e);
  samples.push(carto);
}
// Muestrear terreno a máxima resolución disponible
await Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, samples);

// Aplicar alturas absolutas (base en terreno + extrusión por pisos)
for (let i = 0; i < entities.length; i++) {
  const e = entities[i];
  const pol = e.polygon;
  if (!pol) continue;

  const pisos = Number(e.properties?.CONNPISOS?.getValue?.());
  const altura = Number.isFinite(pisos) ? pisos * 3 : 6; // 3 m/piso

  const base = samples[i].height; // metros sobre el elipsoide
  pol.material = Cesium.Color.fromCssColorString("#7a8a50").withAlpha(0.95);
  pol.outline = true;
  pol.outlineColor = Cesium.Color.BLACK;

  // Alturas ABSOLUTAS: sin heightReference (evita “flotantes”)
  pol.height = base;
  pol.extrudedHeight = base + altura;
  pol.perPositionHeight = false;
}

viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-74.17648138133184, 4.589581121293994, 2700),
    orientation: { heading: 0, pitch: Cesium.Math.toRadians(-25) }
  });

viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function(e) {
  e.cancel = true;
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-74.17648138133184, 4.589581121293994, 2700),
    orientation: {
      heading: 0,
      pitch: Cesium.Math.toRadians(-25)
    }
  });
});