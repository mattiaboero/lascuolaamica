(function () {
  'use strict';
  // rewards.css serve solo alle pagine che caricano js/rewards.js, e quelle
  // dichiarano gia' il preload nell'head: quello e' il segnale, invece di
  // iniettare il foglio ovunque. Su /404 e /tabelline erano ~15 KB di CSS
  // scaricati e parsati senza un solo selettore corrispondente nel markup.
  var files = ['rewards.css'];
  files.forEach(function (href) {
    if (!document.querySelector('link[rel="preload"][href="' + href + '"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  });
})();
