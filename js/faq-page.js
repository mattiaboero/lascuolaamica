// Auto-estratto da faq.html per CSP hardening (no inline script).
(function () {
  'use strict';

  const bg = document.getElementById('bgShapes');
  if (!bg) return;

  // Il controllo va fatto al momento del render, non subito: questo file e'
  // caricato prima di shared.js (ordine dei defer in faq.html), che e' l'unico
  // a impostare html[data-motion] e a esporre SA.motion. Prima si leggeva solo
  // matchMedia in cima al file, quindi il toggle "riduci animazioni" del sito
  // non aveva effetto su /faq mentre sulla home funzionava: la home rende le
  // sue icone dopo il load, quando shared.js e' gia' passato.
  const isMotionReduced = function () {
    try {
      if (window.SA && window.SA.motion && typeof window.SA.motion.isReduced === 'function') {
        return window.SA.motion.isReduced();
      }
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  };

  const icons = ['\u2753', '\ud83d\udcd8', '\ud83d\udca1', '\ud83e\udde0', '\ud83d\udd0e', '\ud83d\udcda', '\u2705', '\ud83c\udfaf'];

  const renderShapes = function () {
    if (bg.childElementCount || isMotionReduced()) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 4; i++) {
      const d = document.createElement('div');
      const variant = window.SADom && typeof window.SADom.randomVariant === 'function'
        ? window.SADom.randomVariant('float-v', 20)
        : 'float-v1';
      d.className = `shape ${variant}`;
      d.textContent = icons[Math.floor(Math.random() * icons.length)];
      frag.appendChild(d);
    }
    bg.appendChild(frag);
  };

  if (document.readyState === 'complete') {
    renderShapes();
  } else {
    window.addEventListener('load', renderShapes, { once: true });
  }
})();
