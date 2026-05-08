(function (global) {
  'use strict';

  const api = global.SADom = global.SADom || {};

  api.show = function (el) {
    if (el) el.classList.remove('is-hidden');
  };

  api.hide = function (el) {
    if (el) el.classList.add('is-hidden');
  };

  api.toggleClass = function (el, cls, enabled) {
    if (el && cls) el.classList.toggle(cls, !!enabled);
  };

  api.lockScroll = function (lock) {
    if (document && document.body) {
      document.body.classList.toggle('modal-open', !!lock);
    }
  };

  api.restartAnimation = function (el, cls) {
    if (!el || !cls) return;
    el.classList.remove(cls);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.classList.add(cls);
      });
    });
  };

  api.randomVariant = function (prefix, count) {
    const safeCount = Math.max(1, Number(count) || 1);
    return String(prefix || '') + (1 + Math.floor(Math.random() * safeCount));
  };
})(typeof window !== 'undefined' ? window : self);
