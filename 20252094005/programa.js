// ===== Utilidad: quitar resaltados previos
function limpiarResaltados(){
  document.querySelectorAll('.resaltado').forEach(el => el.classList.remove('resaltado'));
}

// ===== Resaltar una sección y hacer scroll suave
function resaltar(selector){
  const objetivo = selector === 'html' ? document.documentElement : document.querySelector(selector);
  if(!objetivo) return;

  limpiarResaltados();
  objetivo.classList.add('resaltado');
  objetivo.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Quitar resaltado después de 2.5s
  setTimeout(() => objetivo.classList.remove('resaltado'), 2500);
}

// ===== Menú móvil (abrir/cerrar)
function configurarMenuMovil(){
  const btn = document.getElementById('btnMenu');
  const menu = document.getElementById('menuPrincipal');
  if(!btn || !menu) return;

  btn.addEventListener('click', () => {
    const abierto = menu.classList.toggle('abierto');
    btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
  });

  // Abrir/cerrar submenús tocando el título en móvil
  const items = document.querySelectorAll('.menu-item');
  items.forEach(item => {
    const titulo = item.querySelector('.menu-titulo');
    if(!titulo) return;

    titulo.addEventListener('click', (e) => {
      // Solo en pantallas pequeñas aplicamos comportamiento de acordeón
      if(window.matchMedia('(max-width: 800px)').matches){
        e.preventDefault();
        item.classList.toggle('abierto');
      }
    });
  });
}

// ===== Botones "Ver en la página"
function configurarBotonesTutorial(){
  document.querySelectorAll('.ver-btn').forEach(btn => {
    btn.addEventListener('click', () => resaltar(btn.dataset.target));
  });
}

// ===== Año dinámico en el footer
function ponerAnio(){
  const span = document.getElementById('anio');
  if(span) span.textContent = new Date().getFullYear();
}

// ===== Inicializar cuando cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
  configurarMenuMovil();
  configurarBotonesTutorial();
  ponerAnio();
});
