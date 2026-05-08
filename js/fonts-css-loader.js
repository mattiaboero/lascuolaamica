// Load preloaded stylesheets asynchronously without inline handlers (CSP-safe).
(function () {
  var preloads = document.querySelectorAll('link[rel="preload"][as="style"][data-async-css]');
  if (!preloads.length) return;

  preloads.forEach(function (preload) {
    if (!preload.href) return;
    if (document.querySelector('link[rel="stylesheet"][href="' + preload.href + '"]')) return;

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = preload.href;
    document.head.appendChild(link);
  });
})();
