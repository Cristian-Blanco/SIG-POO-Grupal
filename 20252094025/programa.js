// Inicializar el mapa centrado en Bogotá
const map = L.map('map').setView([4.65, -74.1], 11);

// Capa base (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Estilos para las localidades
const estiloLocalidades = {
  color: "#0000ff",
  weight: 2,
  opacity: 0.8,
  fillOpacity: 0.1
};

// Estilos para el barrio
const estiloBarrio = {
  color: "#ff0000",
  weight: 3,
  opacity: 1,
  fillOpacity: 0.4
};

// Variables para guardar límites
let limitesLocalidad;
let limitesBarrio;

// Referencia al recuadro (para mostrar/ocultar)
let infoBox;

// Cargar localidades
fetch("poligonos-localidades.geojson")
  .then(response => {
    if (!response.ok) {
      throw new Error(`Error al cargar localidades: ${response.status} ${response.statusText}`);
    }
    return response.json();
  })
  .then(localidadesData => {
    if (!localidadesData.features || localidadesData.features.length === 0) {
      throw new Error("El archivo poligonos-localidades.geojson está vacío o tiene formato incorrecto.");
    }

    const localidadesLayer = L.geoJSON(localidadesData, {
      style: estiloLocalidades
    }).addTo(map);

    // Cargar barrio Potosí
    return fetch("potosi.geojson")
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error al cargar barrio: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(barrioData => {
        if (!barrioData.features || barrioData.features.length === 0) {
          throw new Error("El archivo potosi.geojson está vacío o tiene formato incorrecto.");
        }

        const barrioLayer = L.geoJSON(barrioData, { style: estiloBarrio }).addTo(map);
        limitesBarrio = barrioLayer.getBounds();

        // Buscar la localidad que contiene el barrio
        let localidadEncontrada = false;
        localidadesLayer.eachLayer(function (localidad) {
          if (localidad.getBounds().contains(limitesBarrio.getCenter())) {
            limitesLocalidad = localidad.getBounds();
            localidadEncontrada = true;
          }
        });

        if (!localidadEncontrada) {
          console.warn("No se encontró la localidad que contiene al barrio. Usando límites del barrio.");
          limitesLocalidad = limitesBarrio;
        }

        // 1️⃣ Primer zoom: a la localidad
        setTimeout(() => {
          map.flyToBounds(limitesLocalidad, {
            duration: 3,
            padding: [100, 100]
          });
        }, 2000);

        // 2️⃣ Segundo zoom: al barrio Potosí
        setTimeout(() => {
          map.flyToBounds(limitesBarrio, {
            duration: 6,
            padding: [100, 100]
          });

          // ✅ MOSTRAR EL RECUADRO DESPUÉS DEL ZOOM
          mostrarRecuadro();
        }, 5000);
      });
  })
  .catch(err => {
    console.error("Error en la carga de datos:", err.message);
    alert("Hubo un problema al cargar los datos. Revisa que los archivos GeoJSON estén en la carpeta correcta.");
  });

// Función para mostrar el recuadro
function mostrarRecuadro() {
  // Si ya existe, lo eliminamos antes
  if (infoBox) {
    infoBox.remove();
  }

  // Crear el contenedor del recuadro
  infoBox = L.control({ position: 'topright' });

  infoBox.onAdd = function () {
    const div = L.DomUtil.create('div', 'info-box');
    div.innerHTML = `
      <h3>Barrio Potosí</h3>
      <p><strong>Localidad:</strong> Suba</p>
      <p><strong>Zona:</strong> Norte de Bogotá</p>
      <p><strong>Características:</strong> Est ubicado en zona residencial, cerca de vías principales como la Avenida Boyacá y la Calle 80.</p>
      <button onclick="cerrarRecuadro()" style="margin-top: 10px;">Cerrar</button>
    `;
    return div;
  };

  infoBox.addTo(map);
}

// Función global para cerrar el recuadro
window.cerrarRecuadro = function () {
  if (infoBox) {
    infoBox.remove();
    infoBox = null;
  }
};

// Al final de tu archivo proyectoU.js, después de todo el código del mapa
document.getElementById('btn-abrir-info').addEventListener('click', function () {
  mostrarRecuadro();
});