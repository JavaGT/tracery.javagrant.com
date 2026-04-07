/**
 * Browser shim for tracery-grammar (CommonJS → browser global).
 *
 * tracery-grammar ends with `module.exports = tracery`.
 * In a browser there is no `module`, so we stub it before the script runs,
 * then expose the result as `window.tracery` for the ES-module wrapper.
 *
 * This file is loaded as a classic <script> (not type="module") in index.html
 * so it executes synchronously before any ES modules that depend on it.
 */
(function () {
  // Stub CommonJS module/exports so tracery.js doesn't throw
  const _module = { exports: {} };

  // Inline the tracery-grammar source using a function wrapper so we can
  // inject the module stub without modifying the npm file itself.
  // We load it via fetch+eval at startup — but that's async, so instead we
  // use a synchronous XMLHttpRequest (acceptable for a dev/local tool).
  const xhr = new XMLHttpRequest();
  xhr.open('GET', '/js/tracery.js', false /* sync */);
  xhr.send();

  if (xhr.status !== 200) {
    console.error('[tracery-shim] Failed to load tracery-grammar:', xhr.status);
    return;
  }

  // Execute the CJS source with our stub module in scope
  const fn = new Function('module', 'exports', 'require', xhr.responseText);
  fn(_module, _module.exports, () => ({}));

  window.tracery = _module.exports;
})();
