(function (global) {
  'use strict';

  const APP_VERSION = '4.3';
  const CACHE_NAME = `lascuolaamica-v${APP_VERSION.replace(/[^0-9]/g, '') || '1'}`;

  global.SCUOLA_AMICA_VERSION = {
    app: APP_VERSION,
    cacheName: CACHE_NAME
  };

  const SA = global.SA = global.SA || {};
  SA.version = APP_VERSION;
  SA.cacheName = CACHE_NAME;
})(typeof self !== 'undefined' ? self : window);
