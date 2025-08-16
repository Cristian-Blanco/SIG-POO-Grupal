require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer"
], function(Map, MapView, FeatureLayer) {

    // Crear el mapa base
    var map = new Map({
        basemap: "streets" // Mapa base, puedes cambiarlo a "satellite", "topo", etc.
    });

    // Crear la vista del mapa (donde se mostrará el mapa)
    var view = new MapView({
        container: "viewDiv",  // ID del div donde se renderiza el mapa
        map: map,
        center: [-74.0721, 4.6097], // Coordenadas de Bogotá (Longitud, Latitud)
        zoom: 12  // Nivel de zoom inicial
    });

    // Crear la capa de características desde el servicio REST
    var featureLayer = new FeatureLayer({
        url: "https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/mujeres/derechovidalibredeviolencias/MapServer/1"
    });

    // Añadir la capa de feminicidios al mapa
    map.add(featureLayer);

    // Opcional: Agregar controles de la interfaz de usuario (UI)
    view.ui.add("zoom", "top-left");
});
