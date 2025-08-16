fetch('Parques-Marichuela.geojson')
    .then(res => res.json())
    .then(data => {
        const geojsonLayer = L.geoJSON(data, {
            onEachFeature: (feature, layer) => {
                // Ajusta la propiedad según tu GeoJSON (ej: "nombre", "Name", etc.)
                const nombre = feature.properties?.Nombre || feature.properties?.name || "Parque sin nombre";
                layer.bindPopup(nombre);
                
                layer.on('click', () => {
                    infoDiv.style.display = 'block';
                    mapaDiv.style.flex = '1';
                    
                    if (infoParques[nombre]) {
                        infoDiv.innerHTML = `
                            <button class="btn-cerrar" onclick="cerrarPanel()">Cerrar</button>
                            <h2>Descripción general</h2>
                            <h3>${nombre}</h3>
                            <img src="${infoParques[nombre].img}" alt="${nombre}">
                            <p>${infoParques[nombre].desc}</p>
                        `;
                    } else {
                        infoDiv.innerHTML = `
                            <button class="btn-cerrar" onclick="cerrarPanel()">Cerrar</button>
                            <h2>Descripción general</h2>
                            <h3>${nombre}</h3>
                            <p>No hay descripción disponible para este parque.</p>
                        `;
                    }
                });
            },
            style: {
                color: "green",
                weight: 2,
                fillOpacity: 0.4
            }
        }).addTo(mapa);

        // Ajustar zoom automáticamente
        mapa.fitBounds(geojsonLayer.getBounds());
    })
    .catch(err => console.error("Error cargando GeoJSON:", err));

