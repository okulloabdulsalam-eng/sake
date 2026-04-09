f = 'c:/Users/NSPRIME/Desktop/sake/mosques.html'
c = open(f, 'r', encoding='utf-8').read()

# 1. Add message listener for relayed sensor data + request relay in startCompass
old1 = """        var _compassEventReceived = false;
        var _compassCheckTimer = null;

        function startCompass() {
            _compassEventReceived = false;
            window.addEventListener('deviceorientationabsolute', handleOrientation, true);
            window.addEventListener('deviceorientation', handleOrientation, true);
            updateCompassStatus('Waiting for compass data...', 'info');
            
            // Check after 3 seconds if we actually got any events
            if (_compassCheckTimer) clearTimeout(_compassCheckTimer);
            _compassCheckTimer = setTimeout(function() {
                if (!_compassEventReceived) {
                    hasCompass = false;
                    updateCompassStatus('Compass sensor not available. Arrow shows static Qibla direction from North.', 'error');
                    updateQiblaArrow();
                }
            }, 3000);
        }"""

new1 = """        var _compassEventReceived = false;
        var _compassCheckTimer = null;

        // Listen for relayed sensor data from parent (compass doesn't work in iframes)
        window.addEventListener('message', function(evt) {
            if (evt.data && evt.data.type === 'SENSOR_ORIENTATION') {
                handleOrientation(evt.data);
            }
        });

        function startCompass() {
            _compassEventReceived = false;
            // Listen for native events (works outside iframe or with permissions)
            window.addEventListener('deviceorientationabsolute', handleOrientation, true);
            window.addEventListener('deviceorientation', handleOrientation, true);
            // Also request parent to relay sensor events (for iframe context)
            if (window !== window.parent) {
                try { window.parent.postMessage({ type: 'REQUEST_SENSOR_RELAY' }, '*'); } catch(e) {}
            }
            updateCompassStatus('Waiting for compass data...', 'info');
            
            // Check after 3 seconds if we actually got any events
            if (_compassCheckTimer) clearTimeout(_compassCheckTimer);
            _compassCheckTimer = setTimeout(function() {
                if (!_compassEventReceived) {
                    hasCompass = false;
                    updateCompassStatus('Compass sensor not available. Arrow shows static Qibla direction from North.', 'error');
                    updateQiblaArrow();
                }
            }, 3000);
        }"""

if old1 in c:
    c = c.replace(old1, new1)
    open(f, 'w', encoding='utf-8').write(c)
    print('REPLACED OK')
else:
    print('NOT FOUND')
    if 'var _compassEventReceived' in c:
        idx = c.index('var _compassEventReceived')
        print(repr(c[idx:idx+100]))
