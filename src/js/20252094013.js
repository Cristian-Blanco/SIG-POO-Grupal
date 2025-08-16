// Toggle de tips
document.querySelectorAll('.toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.querySelector(btn.dataset.target);
    if (!target) return;
    const visible = target.style.display === 'block';
    target.style.display = visible ? 'none' : 'block';
    btn.textContent = visible ? 'Ver tips' : 'Ocultar tips';
  });
});

// Copiar snippet
const copyBtn = document.getElementById('copy-snippet');
if (copyBtn) {
  copyBtn.addEventListener('click', async () => {
    const code = `fetch('docs/capas/mi_capa.geojson')
  .then(r => r.json())
  .then(data => {
    // Ejemplo Leaflet:
    // L.geoJSON(data).addTo(map);
  });`;
    try {
      await navigator.clipboard.writeText(code);
      copyBtn.textContent = '¡Copiado!';
      copyBtn.style.borderColor = 'var(--ok)';
      setTimeout(() => {
        copyBtn.textContent = 'Copiar snippet';
        copyBtn.style.borderColor = '';
      }, 1400);
    } catch (e) {
      alert('No se pudo copiar. Copia manualmente.');
    }
  });
}
