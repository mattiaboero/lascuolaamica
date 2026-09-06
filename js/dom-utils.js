(function (global) {
  'use strict';

  // Restano solo le due funzioni con call site reali: lockScroll (shared.js,
  // con fallback inline) e randomVariant (subject-quiz-core.js, index-page.js,
  // faq-page.js). show/hide/toggleClass/restartAnimation non erano chiamate da
  // nessuna parte, e nemmeno la classe .is-hidden che le prime due gestivano
  // veniva mai applicata da JS.
  const api = global.SADom = global.SADom || {};

  api.lockScroll = function (lock) {
    if (document && document.body) {
      document.body.classList.toggle('modal-open', !!lock);
    }
  };

  api.randomVariant = function (prefix, count) {
    const safeCount = Math.max(1, Number(count) || 1);
    return String(prefix || '') + (1 + Math.floor(Math.random() * safeCount));
  };
})(typeof window !== 'undefined' ? window : self);
