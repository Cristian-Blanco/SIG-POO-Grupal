// Inicializar el mapa centrado en Bogotá
const map = L.map('map').setView([4.65, -74.1], 11);

// Capa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Estilos
const estiloLocalidades = { color: "#0000ff", weight: 2, opacity: 0.8, fillOpacity: 0.1 };
const estiloBarrio = { color: "#ff0000", weight: 3, opacity: 1, fillOpacity: 0.4 };

// Variables
let limitesLocalidad;
let limitesBarrio;
let infoBox;

// Cargar localidades
fetch("datos/poligonos-localidades.geojson")
  .then(r => r.json())
  .then(localidadesData => {
    const localidadesLayer = L.geoJSON(localidadesData, { style: estiloLocalidades }).addTo(map);

    // Cargar barrio
    return fetch("datos/potosi.geojson")
      .then(r => r.json())
      .then(barrioData => {
        const barrioLayer = L.geoJSON(barrioData, { style: estiloBarrio }).addTo(map);
        limitesBarrio = barrioLayer.getBounds();

        // Buscar la localidad
        localidadesLayer.eachLayer(function (localidad) {
          if (localidad.getBounds().contains(limitesBarrio.getCenter())) {
            limitesLocalidad = localidad.getBounds();
          }
        });

        // Zoom a la localidad
        setTimeout(() => map.flyToBounds(limitesLocalidad, { duration: 3, padding: [100, 100] }), 2000);

        // Zoom al barrio
        setTimeout(() => {
          map.flyToBounds(limitesBarrio, { duration: 6, padding: [100, 100] });
          mostrarRecuadro();
        }, 5000);
      });
  })
  .catch(err => alert("Error cargando datos: " + err));

// Mostrar recuadro
function mostrarRecuadro() {
  if (infoBox) infoBox.remove();

  infoBox = L.control({ position: 'topright' });

  infoBox.onAdd = function () {
    const div = L.DomUtil.create('div', 'info-box');
    div.innerHTML = `
      <h3>Barrio Potosí</h3>
      <p><strong>Localidad:</strong> Suba</p>
      <p><strong>Zona:</strong> Norte de Bogotá</p>
      <p><strong>Características:</strong> Ubicado en zona residencial, cerca de vías principales como la Av. Boyacá y Calle 80.</p>
      <button onclick="cerrarRecuadro()">Cerrar</button>
    `;
    return div;
  };

  infoBox.addTo(map);
}

// Cerrar recuadro
window.cerrarRecuadro = function () {
  if (infoBox) {
    infoBox.remove();
    infoBox = null;
  }
};

// Evento botón
document.getElementById('btn-abrir-info').addEventListener('click', mostrarRecuadro);
