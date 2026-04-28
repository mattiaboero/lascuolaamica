// Auto-estratto da index.html per CSP hardening (no inline script).
// Floating elements (decorative – already aria-hidden on container)
const items = ['✏️','📐','📚','🔬','🎨','⭐','🌟','📝','🔢','🎒','🔭','💡'];
const cont  = document.getElementById('bgFloats');
const reducedMotion = (() => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch (e) { return false; }
})();
if (cont && !reducedMotion) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 4; i++) {
    const el = document.createElement('div');
    el.className = 'float-el';
    el.setAttribute('aria-hidden','true');
    el.textContent = items[Math.floor(Math.random() * items.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.fontSize = (.9 + Math.random() * 1.3) + 'rem';
    el.style.animationDuration = (16 + Math.random() * 18) + 's';
    el.style.animationDelay = (Math.random() * 20) + 's';
    frag.appendChild(el);
  }
  cont.appendChild(frag);
}

const villageDevBtn = document.getElementById('villageDevBtn');
if (villageDevBtn) {
  villageDevBtn.addEventListener('click', () => {
    alert('Funzionalità in fase di sviluppo');
  });
}

// Mascotte homepage — animazione idle dopo entrata
(function () {
  var mascotHome = document.getElementById('mascotHome');
  if (!mascotHome) return;

  var idleDelay = 900;

  var idleTimer = setTimeout(function () {
    mascotHome.classList.add('idle');
  }, idleDelay);

  var root = document.documentElement;
  var observer = new MutationObserver(function () {
    if (root.getAttribute('data-motion') === 'reduce') {
      clearTimeout(idleTimer);
      mascotHome.classList.remove('idle');
    } else {
      mascotHome.classList.add('idle');
    }
  });
  observer.observe(root, { attributes: true, attributeFilter: ['data-motion'] });
})();
