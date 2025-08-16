// Crear el visor
const viewer = new Cesium.Viewer("cesiumContainer", {
  terrainProvider: Cesium.createWorldTerrain(),
  scene3DOnly: true,
  shadows: true,
  animation: false,
  timeline: false
});

// Cargar el GeoJSON
Cesium.GeoJsonDataSource.load("arbalta_construcciones_4326.geojson", {
  clampToGround: true
}).then(function (dataSource) {
  viewer.dataSources.add(dataSource);
  viewer.flyTo(dataSource);

  const entities = dataSource.entities.values;

  // Para cada construcción, aplicar extrusión en función del número de pisos
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const props = entity.properties;

    if (props && props.pisos) {
      const pisos = props.pisos.getValue();
      const altura = pisos * 3; // 3m por piso

      entity.polygon.extrudedHeight = altura;
      entity.polygon.material = Cesium.Color.fromRandom({
        alpha: 0.7
      });
      entity.polygon.outline = false;
    }
  }
});
