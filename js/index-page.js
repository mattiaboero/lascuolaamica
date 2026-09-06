// Auto-estratto da index.html per CSP hardening (no inline script).
// Wrappato in IIFE come ogni altro *-page.js: items, cont e isMotionReduced
// erano le uniche variabili di pagina a finire nello scope globale.
(function () {
  'use strict';

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

  if (cont) {
    const renderFloats = () => {
      // Il controllo va qui, non attorno al blocco: questo file e' caricato
      // prima di shared.js (ordine dei defer), che e' l'unico a impostare
      // html[data-motion] e a esporre SA.motion. Valutandolo subito, il toggle
      // "riduci animazioni" del sito non aveva effetto e le icone comparivano
      // lo stesso; solo la preferenza di sistema veniva rispettata.
      if (cont.childElementCount || isMotionReduced()) return;
      const frag = document.createDocumentFragment();
      for (let i = 0; i < 4; i++) {
        const el = document.createElement('div');
        const variant = window.SADom && typeof window.SADom.randomVariant === 'function'
          ? window.SADom.randomVariant('float-v', 20)
          : 'float-v1';
        el.className = `float-el ${variant}`;
        el.setAttribute('aria-hidden', 'true');
        el.textContent = items[Math.floor(Math.random() * items.length)];
        frag.appendChild(el);
      }
      cont.appendChild(frag);
    };

    const scheduleFloats = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(renderFloats, { timeout: 1200 });
        return;
      }
      setTimeout(renderFloats, 180);
    };

    if (document.readyState === 'complete') {
      scheduleFloats();
    } else {
      window.addEventListener('load', scheduleFloats, { once: true });
    }
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
})();
