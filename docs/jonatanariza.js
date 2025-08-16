require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer"
], function(Map, MapView, FeatureLayer) {

    // Crear el mapa base
    const map = new Map({
        basemap: "streets-navigation-vector"
    });

    // Crear la vista del mapa
    const view = new MapView({
        container: "viewDiv",
        map: map,
        center: [-74.0721, 4.6097], // Coordenadas de Bogotá
        zoom: 11
    });

    // Ocultar la barra de atribución y los controles de zoom
    view.ui.remove("attribution");
    view.ui.empty("top-left");

    // 1. Capa de feminicidios (la capa de puntos que ya tienes)
    const feminicidiosLayer = new FeatureLayer({
        url: "https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/mujeres/derechovidalibredeviolencias/MapServer/1",
        outFields: ["LOCALIDAD", "ANIO_HECHO", "TIPO_VIOLENCIA_GENERO"],
        visible: false // Hacemos esta capa invisible para que no se superponga
    });

    // 2. Capa de polígonos de localidades
    const localidadesLayer = new FeatureLayer({
        url: "https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/Limites_Catastrales/MapServer/1", // URL del servicio de localidades
        outFields: ["Nombre_Localidad"], // Solo se necesitan los campos de nombre
        popupTemplate: {
            title: "Localidad de Bogotá",
            content: async function(event) {
                // Obtener el nombre de la localidad
                const nombreLocalidad = event.graphic.attributes.Nombre_Localidad;

                // Consulta a la capa de feminicidios para contar los casos en la geometría de la localidad
                const query = feminicidiosLayer.createQuery();
                query.geometry = event.graphic.geometry; // Usar la geometría del polígono de la localidad como filtro
                query.outStatistics = [{
                    statisticType: "count",
                    onStatisticField: "OBJECTID",
                    outStatisticFieldName: "total_feminicidios"
                }];

                try {
                    const results = await feminicidiosLayer.queryFeatures(query);
                    const totalAsesinatos = results.features[0].attributes.total_feminicidios || 0;
                    
                    return `
                        <b>Localidad:</b> ${nombreLocalidad}
                        <br>
                        <b>Total de asesinatos:</b> ${totalAsesinatos}
                    `;
                } catch (error) {
                    console.error("Error al consultar los feminicidios:", error);
                    return "No se pudieron obtener los datos de asesinatos.";
                }
            }
        }
    });

    // Añadir ambas capas al mapa
    map.add(localidadesLayer);
    map.add(feminicidiosLayer); // Se agrega para poder consultarla
});