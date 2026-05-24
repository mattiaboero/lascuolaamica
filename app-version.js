(function (global) {
  'use strict';

  const APP_VERSION = '4.6.2';
  const CACHE_NAME = `lascuolaamica-v${APP_VERSION.replace(/[^0-9]/g, '') || '1'}`;
  const VERSION_LABEL = `Versione applicazione ${APP_VERSION}`;

  const SA = global.SA = global.SA || {};
  SA.version = APP_VERSION;
  SA.cacheName = CACHE_NAME;

  function getVersionText(node, version) {
    const format = node.getAttribute('data-app-version-format');
    if (format === 'compact') return `v${version}`;
    return version;
  }

  function populateVersionElements(root) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    if (!SA || !SA.version) return;

    root.querySelectorAll('[data-app-version], .footer-version').forEach((node) => {
      node.textContent = getVersionText(node, SA.version);
      node.setAttribute('data-version', SA.version);
      node.setAttribute('aria-label', VERSION_LABEL);
    });
  }

  SA.applyVersionToDom = populateVersionElements;

  if (global.document) {
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', () => populateVersionElements(global.document), { once: true });
    } else {
      populateVersionElements(global.document);
    }
  }
})(typeof self !== 'undefined' ? self : window);
