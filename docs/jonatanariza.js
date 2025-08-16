require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/Graphic"
], function(Map, MapView, FeatureLayer, SimpleMarkerSymbol, Graphic) {

    // Crear el mapa base
    const map = new Map({
        basemap: "streets-navigation-vector"
    });

    // Crear la vista del mapa, centrada en Bogotá
    const view = new MapView({
        container: "viewDiv",
        map: map,
        center: [-74.0721, 4.6097],
        zoom: 11
    });

    // Ocultar la barra de atribución y los controles de zoom
    view.ui.remove("attribution");
    view.ui.empty("top-left");

    // Definir la plantilla de información emergente (Pop-up Template)
    const popupTemplate = {
        title: "Registro de Incidente",
        content: "<b>Localidad:</b> {LOCALIDAD}<br><b>Año:</b> {ANIO_HECHO}<br><b>Descripción:</b> {TIPO_VIOLENCIA_GENERO}"
    };

    // Crear la capa de características desde el servicio REST de Bogotá
    const featureLayer = new FeatureLayer({
        url: "https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/mujeres/derechovidalibredeviolencias/MapServer/1",
        outFields: ["LOCALIDAD", "ANIO_HECHO", "TIPO_VIOLENCIA_GENERO", "OBJECTID", "SHAPE"],
        popupTemplate: popupTemplate
    });

    // Añadir la capa de características al mapa
    map.add(featureLayer);

    // Cuando se carguen los datos del FeatureLayer, recorrer los puntos y agregar los marcadores
    featureLayer.when(function() {
        featureLayer.queryFeatures().then(function(response) {
            const features = response.features;
            features.forEach(function(feature) {
                // Obtener la geometría del punto (suponiendo que 'SHAPE' es punto)
                const point = feature.geometry;

                // Crear un símbolo para el marcador
                const markerSymbol = new SimpleMarkerSymbol({
                    color: [255, 0, 0],  // Color rojo
                    size: 10,  // Tamaño del marcador
                    outline: {
                        color: [255, 255, 255],  // Borde blanco
                        width: 1
                    }
                });

                // Crear un gráfico con el punto y el símbolo
                const pointGraphic = new Graphic({
                    geometry: point,
                    symbol: markerSymbol,
                    attributes: feature.attributes,
                    popupTemplate: popupTemplate
                });

                // Agregar el gráfico al mapa
                view.graphics.add(pointGraphic);
            });
        });
    });
});
