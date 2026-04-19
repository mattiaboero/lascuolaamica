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
  for (let i = 0; i < 18; i++) {
    const d = document.createElement('div');
    d.className = 'shape';
    d.textContent = icons[Math.floor(Math.random() * icons.length)];
    d.style.left = Math.random() * 100 + 'vw';
    d.style.fontSize = (0.9 + Math.random() * 1.2) + 'rem';
    d.style.animationDuration = (10 + Math.random() * 12) + 's';
    d.style.animationDelay = (Math.random() * 16) + 's';
    frag.appendChild(d);
  }
  bg.appendChild(frag);
})();
