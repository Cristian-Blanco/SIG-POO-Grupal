require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer"
], function(Map, MapView, FeatureLayer) {

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
        outFields: ["LOCALIDAD", "ANIO_HECHO", "TIPO_VIOLENCIA_GENERO", "OBJECTID"],
        popupTemplate: popupTemplate,
        // Configurar un renderizador para mostrar los puntos como marcadores
        renderer: {
            type: "simple",
            symbol: {
                type: "simple-marker",
                style: "circle",
                color: [255, 0, 0, 0.8], // Color rojo semi-transparente
                size: "8px",
                outline: {
                    color: [255, 255, 255, 0.8],
                    width: 1
                }
            }
        }
    });

    // Añadir la capa al mapa
    map.add(featureLayer);
});