/* Set to false when Al Quran reader and Quran Study should be available again. */
(function () {
  'use strict';
  var KIUMA_QURAN_MAINTENANCE = true;
  if (!KIUMA_QURAN_MAINTENANCE || !document.body) return;

  window.KIUMA_QURAN_MAINTENANCE_ACTIVE = true;

  var css =
    '#kiumaQuranMaint{position:fixed;inset:0;z-index:2147483000;' +
    'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
    'padding:max(24px,env(safe-area-inset-top)) max(24px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(24px,env(safe-area-inset-left));' +
    'text-align:center;background:linear-gradient(165deg,#0b1220 0%,#1a2332 50%,#0f172a 100%);' +
    'color:#f1f5f9;font-family:system-ui,-apple-system,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif;}' +
    '#kiumaQuranMaint .kqm-icon{font-size:3rem;line-height:1;margin-bottom:1.25rem;}' +
    '#kiumaQuranMaint h1{font-size:1.35rem;font-weight:700;margin:0 0 .75rem;line-height:1.35;}' +
    '#kiumaQuranMaint p{font-size:.95rem;color:#94a3b8;max-width:22rem;margin:0 0 1.75rem;line-height:1.55;}' +
    '#kiumaQuranMaint a{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.75rem 1.5rem;' +
    'background:#22c55e;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;font-size:.9rem;}' +
    '#kiumaQuranMaint a:active{filter:brightness(.95);}';

  var st = document.createElement('style');
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  var el = document.createElement('div');
  el.id = 'kiumaQuranMaint';
  el.setAttribute('role', 'alert');
  el.innerHTML =
    '<div class="kqm-icon" aria-hidden="true">🛠️</div>' +
    '<h1>Al Quran is under maintenance</h1>' +
    '<p>We’re updating the reader and Quran study section. Please try again later. Thank you for your patience.</p>' +
    '<a href="index.html">Back to home</a>';

  document.body.insertBefore(el, document.body.firstChild);
})();
