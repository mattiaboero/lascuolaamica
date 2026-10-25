(function () {
  'use strict';
  // Pagine materia: il CSS che serve al primo disegno e' inline (blocco
  // CSS-CRITICO, scripts/build_css_critico.js), i fogli completi arrivano con
  // media="print" per non bloccare. Qui si accendono.
  document.querySelectorAll('link[data-css-completo]').forEach(function (link) {
    link.media = 'all';
  });

  // rewards.css serve solo alle pagine che caricano js/rewards.js. Il segnale
  // era un <link rel="preload"> nell'head, che Cloudflare trasformava anche in
  // un header Link: rewards.css scaricato in apertura senza servire prima del
  // load. Ora il segnale e' lo script stesso.
  // Nell'export gli URL portano ?v=<versione> (scripts/versiona_asset.js):
  // i selettori guardano il percorso, e rewards.css prende la ?v= di questo
  // script, cioe' la versione della pagina.
  if (!document.querySelector('script[src*="js/rewards.js"]')) return;
  if (document.querySelector('link[rel="stylesheet"][href^="rewards.css"]')) return;
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'rewards.css' + (document.currentScript ? new URL(document.currentScript.src).search : '');
  document.head.appendChild(link);
})();
