/**
 * ESM re-export of the tracery-grammar npm package.
 *
 * tracery-grammar is a CommonJS module and cannot be directly imported as ESM
 * in a browser without a bundler.  tracery-npm-shim.js (loaded as a classic
 * <script> before any modules) stubs `module`/`exports`, runs tracery.js, and
 * stores the result on `window.tracery`.  This wrapper re-exports it so the
 * rest of the app can keep using `import tracery from './js/tracery/main.js'`.
 */

// window.tracery is guaranteed to exist by the time this module runs because
// the shim is a synchronous classic script that completes before any module.
const tracery = window.tracery;

export default tracery;
