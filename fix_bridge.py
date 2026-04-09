f = 'c:/Users/NSPRIME/Desktop/sake/js/app-bridge.js'
c = open(f, 'r', encoding='utf-8').read()

old = """    // Try to open an external URL using multiple methods for robustness
    function openExternalUrl(href) {
        console.log('[KiumaBridge] Opening external URL:', href);
        // Method 1: Send to parent bridge (native Intent via Capacitor plugin)
        sendToParent('OPEN_EXTERNAL', { url: href });
        // Method 2: Fallback after 600ms - try real window.open if bridge didn't handle it
        setTimeout(function() {
            try {
                _realWindowOpen.call(window, href, '_system');
            } catch(ex) {
                try { _realWindowOpen.call(window, href, '_blank'); } catch(ex2) {}
            }
        }, 600);
    }"""

new = """    // Try to open an external URL using multiple methods for robustness
    function openExternalUrl(href) {
        console.log('[KiumaBridge] Opening external URL:', href);
        // Method 1: Direct native JS interface (works from iframe, no postMessage needed)
        if (window.KiumaNative && window.KiumaNative.openExternal) {
            try {
                window.KiumaNative.openExternal(href);
                console.log('[KiumaBridge] Opened via KiumaNative');
                return;
            } catch(e) {
                console.warn('[KiumaBridge] KiumaNative failed:', e);
            }
        }
        // Method 2: Send to parent bridge (native Intent via Capacitor plugin)
        sendToParent('OPEN_EXTERNAL', { url: href });
        // Method 3: Fallback after 600ms - try real window.open if bridge didn't handle it
        setTimeout(function() {
            try {
                _realWindowOpen.call(window, href, '_system');
            } catch(ex) {
                try { _realWindowOpen.call(window, href, '_blank'); } catch(ex2) {}
            }
        }, 600);
    }"""

if old in c:
    c2 = c.replace(old, new)
    open(f, 'w', encoding='utf-8').write(c2)
    print('REPLACED OK')
else:
    print('NOT FOUND')
