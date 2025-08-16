require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/Graphic",
    "esri/geometry/Point"
], function(Map, MapView, FeatureLayer, Graphic, Point) {

    // Crear el mapa base
    var map = new Map({
        basemap: "streets" // Puedes cambiar el mapa base a "satellite", "topo", etc.
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

    // Agregar puntos de ejemplo (coordenadas ficticias para demostrar cómo agregar puntos)
    var puntos = [
        { "lat": 4.6097, "lon": -74.0721, "localidad": "Centro", "asesinatos": 5 },
        { "lat": 4.6173, "lon": -74.0728, "localidad": "Suba", "asesinatos": 8 },
        { "lat": 4.6231, "lon": -74.0753, "localidad": "Kennedy", "asesinatos": 6 }
    ];

    puntos.forEach(function(punto) {
        // Crear un punto usando las coordenadas
        var point = new Point({
            longitude: punto.lon,
            latitude: punto.lat
        });

        // Crear un gráfico para representar el punto
        var pointGraphic = new Graphic({
            geometry: point,
            symbol: {
                type: "simple-marker",
                color: [226, 119, 40],  // Color naranja
                size: "8px"
            },
            attributes: {
                descripcion: punto.localidad,
                total_asesinatos: punto.asesinatos
            },
            popupTemplate: {
                title: "Localidad: {descripcion}",
                content: "Total de feminicidios: {total_asesinatos}"
            }
        });

        // Añadir el gráfico de puntos al mapa
        view.graphics.add(pointGraphic);
    });

    // Opcional: Agregar controles de la interfaz de usuario (UI)
    view.ui.add("zoom", "top-left");
});
