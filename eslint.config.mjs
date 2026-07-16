const commonGlobals = {
  SA: 'writable',
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  location: 'readonly',
  history: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  fetch: 'readonly',
  console: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  Intl: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  AudioContext: 'readonly',
  webkitAudioContext: 'readonly',
  alert: 'readonly',
  confirm: 'readonly',
  CustomEvent: 'readonly',
  Event: 'readonly',
  Element: 'readonly',
  HTMLElement: 'readonly',
  Node: 'readonly',
  Image: 'readonly',
  DOMParser: 'readonly',
  MutationObserver: 'readonly',
  IntersectionObserver: 'readonly',
  performance: 'readonly',
  matchMedia: 'readonly',
  crypto: 'readonly',
  Blob: 'readonly',
  FormData: 'readonly',
  Headers: 'readonly',
  Response: 'readonly',
  Request: 'readonly',
  atob: 'readonly',
  btoa: 'readonly',
  structuredClone: 'readonly',
  globalThis: 'readonly',
  self: 'readonly',
  caches: 'readonly',
  clients: 'readonly',
  skipWaiting: 'readonly',
  importScripts: 'readonly',
  process: 'readonly',
  require: 'readonly',
  module: 'writable',
  exports: 'writable',
  __dirname: 'readonly',
  __filename: 'readonly',
  Buffer: 'readonly',
  global: 'readonly'
};

const sharedRules = {
  'no-unused-vars': ['warn', {
    argsIgnorePattern: '^_',
    varsIgnorePattern: '^_',
    caughtErrorsIgnorePattern: '^(e|_|err)$'
  }],
  'no-undef': 'error',
  semi: ['error', 'always'],
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'no-restricted-properties': ['error',
    {
      object: 'Element',
      property: 'innerHTML',
      message: 'Use textContent or createElement/appendChild instead of innerHTML to prevent XSS'
    },
    {
      object: 'Element',
      property: 'insertAdjacentHTML',
      message: 'Use textContent or createElement/appendChild instead of insertAdjacentHTML to prevent XSS'
    }
  ]
};

export default [
  {
    files: ['*.js', 'js/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: commonGlobals
    },
    rules: sharedRules
  }
];
