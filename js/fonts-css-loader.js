// Load fonts stylesheet asynchronously without inline handlers (CSP-safe).
(function () {
  var preload = document.getElementById('fontsCssPreload');
  if (!preload || !preload.href) return;

  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = preload.href;
  document.head.appendChild(link);
})();
