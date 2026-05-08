// Auto-estratto da index.html per CSP hardening (no inline script).
// Floating elements (decorative – already aria-hidden on container)
const items = ['✏️','📐','📚','🔬','🎨','⭐','🌟','📝','🔢','🎒','🔭','💡'];
const cont  = document.getElementById('bgFloats');
const isMotionReduced = (() => {
  return function () {
    try {
      if (window.SA && window.SA.motion && typeof window.SA.motion.isReduced === 'function') {
        return window.SA.motion.isReduced();
      }
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  };
})();
if (cont && !isMotionReduced()) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 4; i++) {
    const el = document.createElement('div');
    const variant = window.SADom && typeof window.SADom.randomVariant === 'function'
      ? window.SADom.randomVariant('float-v', 20)
      : 'float-v1';
    el.className = `float-el ${variant}`;
    el.setAttribute('aria-hidden','true');
    el.textContent = items[Math.floor(Math.random() * items.length)];
    frag.appendChild(el);
  }
  cont.appendChild(frag);
}

const villageDevBtn = document.getElementById('villageDevBtn');
if (villageDevBtn) {
  villageDevBtn.addEventListener('click', () => {
    if (window.SA && window.SA.ui && typeof window.SA.ui.alert === 'function') {
      window.SA.ui.alert('Funzionalità in fase di sviluppo.', {
        title: 'Villaggio Educativo',
        okLabel: 'Va bene'
      });
      return;
    }
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
