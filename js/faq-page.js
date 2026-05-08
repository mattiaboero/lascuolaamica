// Auto-estratto da faq.html per CSP hardening (no inline script).
(function () {
  const bg = document.getElementById('bgShapes');
  if (!bg) return;
  let reducedMotion = false;
  try {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    reducedMotion = false;
  }
  if (reducedMotion) return;

  const icons = ['❓', '📘', '💡', '🧠', '🔎', '📚', '✅', '🎯'];
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
})();
