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

    // Definir el Pop-up Template para los puntos de la capa
    const popupTemplate = {
        title: "Registro de Incidente",
        content: "<b>Localidad:</b> {LOCALIDAD}<br><b>Año:</b> {ANIO_HECHO}<br><b>Descripción:</b> {TIPO_VIOLENCIA_GENERO}"
    };

    // Crear la capa de características desde el servicio REST
    const featureLayer = new FeatureLayer({
        url: "https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/mujeres/derechovidalibredeviolencias/MapServer/1",
        outFields: ["LOCALIDAD", "ANIO_HECHO", "TIPO_VIOLENCIA_GENERO", "OBJECTID"],
        popupTemplate: popupTemplate
    });

    // Añadir la capa de feminicidios al mapa
    map.add(featureLayer);

    // --- ANÁLISIS ESTADÍSTICO ---
    
    // Definir el rango de fechas de análisis
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    
    // Construir la cláusula de consulta de fecha (WHERE)
    // El campo de la fecha en el servicio REST es "FECHA_HECHO"
    // Los servicios REST de ArcGIS usan milisegundos desde la época UNIX para las fechas
    const whereClause = `FECHA_HECHO >= ${startDate.getTime()} AND FECHA_HECHO <= ${endDate.getTime()}`;

    // Esperar a que la vista de la capa esté lista para ejecutar la consulta
    view.whenLayerView(featureLayer).then(function(layerView) {
        
        // Consultar el total de incidentes
        const queryTotal = featureLayer.createQuery();
        queryTotal.where = whereClause; // Aplicar el filtro de fecha
        queryTotal.outStatistics = [{
            statisticType: "count",
            onStatisticField: "OBJECTID",
            outStatisticFieldName: "total"
        }];

        featureLayer.queryFeatures(queryTotal).then(function(results) {
            const totalIncidentes = results.features[0].attributes.total;
            document.getElementById("total-stats").innerHTML = `<p><strong>Total de incidentes registrados (2024):</strong> ${totalIncidentes}</p>`;
        }).catch(function(error) {
            console.error("Error al obtener el conteo total:", error);
        });

        // Consultar el conteo de incidentes por localidad
        const queryLocalidades = featureLayer.createQuery();
        queryLocalidades.where = whereClause; // Aplicar el filtro de fecha
        queryLocalidades.groupByFieldsForStatistics = ["LOCALIDAD"];
        queryLocalidades.outStatistics = [{
            statisticType: "count",
            onStatisticField: "OBJECTID",
            outStatisticFieldName: "conteo"
        }];

        featureLayer.queryFeatures(queryLocalidades).then(function(results) {
            const statsElement = document.getElementById("localidad-stats");
            let statsList = "<h3>Incidentes por Localidad (2024):</h3><ul>";
            
            // Organizar los resultados de mayor a menor
            const sortedResults = results.features.sort((a, b) => b.attributes.conteo - a.attributes.conteo);

            sortedResults.forEach(function(feature) {
                const localidad = feature.attributes.LOCALIDAD || "Sin Localidad";
                const conteo = feature.attributes.conteo;
                
                statsList += `<li><span>${localidad}</span><span>${conteo}</span></li>`;
            });

            statsList += "</ul>";
            statsElement.innerHTML = statsList;
        }).catch(function(error) {
            console.error("Error al obtener las estadísticas por localidad:", error);
        });
    });

    // Opcional: Agregar controles de la interfaz de usuario (UI)
    view.ui.add("zoom", "top-left");
});