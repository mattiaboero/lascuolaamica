(function () {
  'use strict';
  var files = ['rewards.css'];
  files.forEach(function (href) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  });
})();
