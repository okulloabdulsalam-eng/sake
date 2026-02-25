// Service Worker Registration with Instant Update Detection
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('Service Worker registered:', reg.scope);

                // Check for updates every 60 seconds when online
                setInterval(() => {
                    if (navigator.onLine) reg.update().catch(() => {});
                }, 60000);

                // Detect waiting worker (new version ready)
                if (reg.waiting) {
                    showUpdateBanner(reg.waiting);
                }

                // Detect new SW installing
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (!newWorker) return;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version installed & old one is active — prompt user
                            showUpdateBanner(newWorker);
                        }
                    });
                });
            })
            .catch(err => console.log('Service Worker registration failed:', err));
    });

    // Auto-reload when new SW takes over
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
    });
}

function showUpdateBanner(worker) {
    // Don't show if already showing
    if (document.getElementById('swUpdateBanner')) return;
    var banner = document.createElement('div');
    banner.id = 'swUpdateBanner';
    banner.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#1B5E20,#2E7D32);color:#fff;padding:12px 20px;border-radius:12px;z-index:99999;display:flex;align-items:center;gap:12px;box-shadow:0 4px 20px rgba(0,0,0,0.3);font-size:14px;font-weight:500;max-width:90%;animation:slideUpBanner 0.4s ease;';
    banner.innerHTML = '<i class="fas fa-sync-alt" style="font-size:18px;"></i><span>New update available!</span><button onclick="applySwUpdate()" style="background:#fff;color:#1B5E20;border:none;padding:6px 16px;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;">Update Now</button><button onclick="this.parentElement.remove()" style="background:none;border:none;color:rgba(255,255,255,0.7);cursor:pointer;font-size:18px;padding:0 4px;">×</button>';
    // Add animation keyframes if not present
    if (!document.getElementById('swUpdateStyle')) {
        var style = document.createElement('style');
        style.id = 'swUpdateStyle';
        style.textContent = '@keyframes slideUpBanner{from{opacity:0;transform:translateX(-50%) translateY(30px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}';
        document.head.appendChild(style);
    }
    document.body.appendChild(banner);
    // Store worker reference for the update button
    window._pendingSwWorker = worker;
}

function applySwUpdate() {
    var banner = document.getElementById('swUpdateBanner');
    if (banner) banner.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    if (window._pendingSwWorker) {
        window._pendingSwWorker.postMessage({ type: 'SKIP_WAITING' });
    } else if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    // Fallback reload after 3s if controllerchange doesn't fire
    setTimeout(function() { window.location.reload(); }, 3000);
}

// Offline/Online Detection and Notification Banner
(function() {
    const isKiumaApp = /KIUMA-App\/1\.0/i.test(navigator.userAgent || '');
    if (isKiumaApp) return;

    let offlineBanner = null;
    
    function createOfflineBanner() {
        if (offlineBanner) return offlineBanner;
        
        offlineBanner = document.createElement('div');
        offlineBanner.id = 'offlineBanner';
        offlineBanner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            padding: 10px 15px;
            text-align: center;
            font-size: 14px;
            font-weight: 600;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transform: translateY(-100%);
            transition: transform 0.3s ease;
        `;
        offlineBanner.innerHTML = '<i class="fas fa-wifi-slash" style="font-size: 16px;"></i> You are offline, some features may be limited';
        document.body.appendChild(offlineBanner);
        return offlineBanner;
    }
    
    function showOfflineBanner() {
        const banner = createOfflineBanner();
        setTimeout(() => {
            banner.style.transform = 'translateY(0)';
        }, 100);
    }
    
    function hideOfflineBanner() {
        if (offlineBanner) {
            offlineBanner.style.transform = 'translateY(-100%)';
            setTimeout(() => {
                if (offlineBanner && offlineBanner.parentNode) {
                    offlineBanner.parentNode.removeChild(offlineBanner);
                    offlineBanner = null;
                }
            }, 300);
        }
    }
    
    function updateConnectionStatus() {
        if (navigator.onLine) {
            hideOfflineBanner();
        } else {
            showOfflineBanner();
        }
    }
    
    // Check initial status
    window.addEventListener('DOMContentLoaded', () => {
        if (!navigator.onLine) {
            showOfflineBanner();
        }
    });
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
        hideOfflineBanner();
        showToast('Back online!', 'success', 2000);
    });
    
    window.addEventListener('offline', () => {
        showOfflineBanner();
    });
})();


const THEME_PREFERENCE_KEY = 'themePreference';

function getThemePreference() {
    try {
        const stored = localStorage.getItem(THEME_PREFERENCE_KEY);
        if (stored === 'system' || stored === 'light' || stored === 'dark') return stored;
    } catch (e) {
    }
    return 'light';
}

function applyThemePreference(preference) {
    const root = document.documentElement;
    if (preference === 'dark') {
        root.setAttribute('data-theme', 'dark');
        return;
    }
    if (preference === 'light') {
        root.setAttribute('data-theme', 'light');
        return;
    }
    root.removeAttribute('data-theme');
}

function setThemePreference(preference) {
    if (preference !== 'system' && preference !== 'light' && preference !== 'dark') {
        preference = 'system';
    }
    try {
        localStorage.setItem(THEME_PREFERENCE_KEY, preference);
    } catch (e) {
    }
    applyThemePreference(preference);
}

applyThemePreference(getThemePreference());

window.ThemePreference = {
    get: getThemePreference,
    set: setThemePreference,
    apply: applyThemePreference
};

function initSettingsThemeSelector() {
    const select = document.getElementById('settingsThemeSelect');
    if (!select) return;
    select.value = getThemePreference();
    select.addEventListener('change', () => {
        setThemePreference(select.value);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettingsThemeSelector);
} else {
    initSettingsThemeSelector();
}

window.addEventListener('storage', (e) => {
    if (e.key === THEME_PREFERENCE_KEY || e.key === null) {
        applyThemePreference(getThemePreference());
        const select = document.getElementById('settingsThemeSelect');
        if (select) select.value = getThemePreference();
    }
});


// Toast Notification System
function showToast(message, type = 'default', duration = 3000) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Hide and remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Page Navigation with Transition
function navigateTo(url) {
    const main = document.querySelector('.main-content');
    if (main) {
        main.style.opacity = '0';
        main.style.transform = 'translateY(10px)';
    }
    setTimeout(() => {
        window.location.href = url;
    }, 150);
}

// Firebase Cloud Messaging (FCM) for Push Notifications
let fcmToken = null;
let fcmInitialized = false;
let fcmSwRegistration = null;

async function initializeFCM() {
    if (fcmInitialized) return;
    
    // Check if Firebase and messaging are available
    if (typeof firebase === 'undefined') {
        console.log('Firebase not loaded yet, retrying...');
        setTimeout(initializeFCM, 2000);
        return;
    }
    
    if (!firebase.messaging) {
        console.log('Firebase Messaging not available');
        return;
    }
    
    // Check if notifications are supported
    if (!('Notification' in window)) {
        console.log('Notifications not supported in this browser');
        return;
    }
    
    try {
        const messaging = firebase.messaging();

        // Use the existing offline service worker (sw.js) registration for FCM
        if ('serviceWorker' in navigator) {
            try {
                fcmSwRegistration = await navigator.serviceWorker.ready;
            } catch (swError) {
                console.warn('FCM SW not ready:', swError);
            }
        }
        
        // Request permission if not already granted
        if (Notification.permission === 'granted') {
            await getFCMToken(messaging);
            fcmInitialized = true;
        } else if (Notification.permission === 'default') {
            // Show a friendly prompt first
            const shouldAsk = !localStorage.getItem('fcmDeclined');
            if (shouldAsk) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    await getFCMToken(messaging);
                    fcmInitialized = true;
                } else if (permission === 'denied') {
                    localStorage.setItem('fcmDeclined', 'true');
                    console.log('Notification permission denied');
                }
            }
        } else {
            console.log('Notifications blocked by user');
        }
        
        // Handle foreground messages
        messaging.onMessage((payload) => {
            console.log('FCM foreground message:', payload);
            showForegroundNotification(payload);
        });
        
    } catch (error) {
        console.error('FCM initialization error:', error);
        // Retry after delay
        setTimeout(initializeFCM, 5000);
    }
}

async function getFCMToken(messaging) {
    try {
        const tokenOptions = {
            vapidKey: 'BHMDvl2IeqHupDGCross8v0eqlwcTDHDeOGXYbWmUiHqFysd1h_zual-w7_RJGw3qTd1BuDr3zI4Dx2Fo5fnDq0'
        };
        if (fcmSwRegistration) {
            tokenOptions.serviceWorkerRegistration = fcmSwRegistration;
        }
        fcmToken = await messaging.getToken(tokenOptions);
        
        if (fcmToken) {
            console.log('FCM Token obtained:', fcmToken.substring(0, 20) + '...');
            localStorage.setItem('fcmToken', fcmToken);
            saveFCMTokenToFirestore(fcmToken);
            showPushNotificationConfirmation();
        }
    } catch (error) {
        console.error('Failed to get FCM token:', error);
    }
}

async function saveFCMTokenToFirestore(token) {
    const deviceId = localStorage.getItem('deviceId') || generateDeviceId();
    localStorage.setItem('deviceId', deviceId);

    // Register with Cloudflare notifications worker (primary)
    const NOTIFY_WORKER_URL = localStorage.getItem('kiuma_notifications_worker_url') || 'https://kiuma-notifications.kiuma.workers.dev';
    try {
        const resp = await fetch(NOTIFY_WORKER_URL + '/api/register-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token, device_id: deviceId })
        });
        const data = await resp.json();
        if (data.success) {
            console.log('FCM token registered with push worker');
        } else {
            console.warn('Push worker registration:', data.message);
        }
    } catch (err) {
        console.warn('Failed to register token with push worker:', err.message);
    }

    // Also save to Firestore (backup)
    if (typeof firebase === 'undefined' || !firebase.firestore) return;
    try {
        await firebase.firestore().collection('fcm_tokens').doc(deviceId).set({
            token: token,
            deviceId: deviceId,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            userAgent: navigator.userAgent,
            platform: navigator.platform
        }, { merge: true });
        console.log('FCM token saved to Firestore');
    } catch (error) {
        console.warn('Failed to save FCM token to Firestore:', error);
    }
}

function generateDeviceId() {
    return 'device-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
}

function showForegroundNotification(payload) {
    const title = payload.notification?.title || payload.data?.title || 'KIUMA Update';
    const body = payload.notification?.body || payload.data?.body || '';
    
    // Show in-app toast
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:var(--whatsapp-green);color:var(--toast-text);padding:15px 20px;border-radius:10px;z-index:9999;box-shadow:0 4px 15px rgba(0,0,0,0.3);max-width:90%;cursor:pointer;';
    toast.innerHTML = `<strong>${title}</strong><br><span style="opacity:0.9">${body}</span>`;
    toast.onclick = () => { window.location.href = '/notifications.html'; toast.remove(); };
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 6000);
}

function showPushNotificationConfirmation() {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--primary-green);color:var(--toast-text);padding:12px 24px;border-radius:8px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
    toast.textContent = '✓ Notifications enabled! You\'ll receive updates even when the app is closed.';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

// Initialize FCM when Firebase is ready
if (typeof firebase !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeFCM, 1000);
    });
}

// Navigation Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const navClose = document.getElementById('navClose');
const overlay = document.createElement('div');
overlay.className = 'overlay';
document.body.appendChild(overlay);

// Firebase Auth State Listener - handles persistent login
if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(async function(user) {
        if (user) {
            // User is signed in - use localStorage first, try Firestore silently
            const storedUser = localStorage.getItem('userData');
            if (storedUser) {
                currentUser = JSON.parse(storedUser);
                updateUserDisplay();
            } else {
                currentUser = { uid: user.uid, email: user.email, name: user.displayName || user.email.split('@')[0] };
                localStorage.setItem('userData', JSON.stringify(currentUser));
                updateUserDisplay();
            }
            
            // Try to get Firestore data silently (don't error if permissions fail)
            try {
                const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    currentUser = { uid: user.uid, email: user.email, ...userDoc.data() };
                    localStorage.setItem('userData', JSON.stringify(currentUser));
                    updateUserDisplay();
                }
            } catch (e) {
                // Silently ignore Firestore permission errors - localStorage is sufficient
            }
        } else {
            // User is signed out
            currentUser = null;
            localStorage.removeItem('userData');
            updateUserDisplay();
        }
    });
}

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.add('active');
        overlay.classList.add('active');
    });
}

if (navClose) {
    navClose.addEventListener('click', () => {
        navMenu.classList.remove('active');
        overlay.classList.remove('active');
    });
}

overlay.addEventListener('click', () => {
    navMenu.classList.remove('active');
    overlay.classList.remove('active');
});

// Sticky mini-bar — auto-creates and shows/hides on scroll past .page-hero
(function initStickyMiniBar() {
    const hero = document.querySelector('.page-hero');
    if (!hero) return; // no hero on this page, skip

    // Extract page title from hero
    const titleEl = hero.querySelector('.hero-page-title');
    const pageTitle = titleEl ? titleEl.textContent.trim() : 'KIUMA';

    // Check for admin link in the hero
    const adminLink = hero.querySelector('.hero-admin-link');
    const adminHref = adminLink ? adminLink.getAttribute('href') : null;

    // Build the mini-bar
    const bar = document.createElement('div');
    bar.className = 'sticky-mini-bar';
    bar.innerHTML =
        '<div class="smb-left">' +
            '<button class="smb-btn" id="smbMenuToggle"><i class="fas fa-bars"></i></button>' +
            '<span class="smb-title">' + pageTitle + '</span>' +
        '</div>' +
        '<div class="smb-right">' +
            (adminHref ? '<a href="' + adminHref + '" class="smb-admin-link"><i class="fas fa-cog"></i> Admin</a>' : '') +
            '<button class="smb-btn" id="smbNotifications" onclick="window.location.href=\'notifications.html\'">' +
                '<i class="fas fa-bell"></i>' +
                '<span class="badge">3</span>' +
            '</button>' +
            '<div class="smb-profile-avatar" onclick="if(typeof toggleAccountModal===\'function\')toggleAccountModal()"><i class="fas fa-user"></i></div>' +
        '</div>';

    document.body.appendChild(bar);

    // Wire menu toggle to same nav sidebar
    const smbMenu = document.getElementById('smbMenuToggle');
    if (smbMenu) {
        smbMenu.addEventListener('click', function() {
            var nm = document.getElementById('navMenu');
            var ov = document.querySelector('.overlay');
            if (nm) nm.classList.add('active');
            if (ov) ov.classList.add('active');
        });
    }

    // Show/hide on scroll with IntersectionObserver (performant)
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                bar.classList.remove('visible');
            } else {
                bar.classList.add('visible');
            }
        });
    }, { threshold: 0, rootMargin: '0px' });

    observer.observe(hero);
})();

// Hijri month names (global for reuse)
const hijriMonths = ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 
                   'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 
                   'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'];

// Local Hijri date calculation (Umm al-Qura approximation)
// This calculates Hijri date locally when offline
function calculateHijriDate(gregorianDate) {
    const date = gregorianDate || new Date();
    
    // Reference point: 1 Muharram 1446 AH = July 7, 2024
    // Using a known accurate reference for better precision
    const referenceGregorian = new Date(2024, 6, 7); // July 7, 2024
    const referenceHijri = { year: 1446, month: 1, day: 1 };
    
    // Calculate days difference
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysDiff = Math.floor((date.getTime() - referenceGregorian.getTime()) / msPerDay);
    
    // Hijri year is approximately 354.36667 days (lunar year)
    const hijriYearLength = 354.36667;
    const hijriMonthLength = 29.530589; // Average lunar month
    
    // Calculate total Hijri days from reference
    let totalHijriDays = daysDiff;
    
    // Start from reference Hijri date
    let hijriYear = referenceHijri.year;
    let hijriMonth = referenceHijri.month;
    let hijriDay = referenceHijri.day + totalHijriDays;
    
    // Month lengths in Hijri calendar (alternating 30 and 29 days)
    // Some years have 30 days in the 12th month (leap years)
    function getMonthLength(month, year) {
        // Odd months have 30 days, even months have 29 days
        // Except in leap years, month 12 has 30 days
        const isLeapYear = ((11 * year + 14) % 30) < 11;
        if (month === 12 && isLeapYear) return 30;
        return month % 2 === 1 ? 30 : 29;
    }
    
    function getYearLength(year) {
        let total = 0;
        for (let m = 1; m <= 12; m++) {
            total += getMonthLength(m, year);
        }
        return total;
    }
    
    // Normalize the date (handle overflow/underflow)
    while (hijriDay > getMonthLength(hijriMonth, hijriYear)) {
        hijriDay -= getMonthLength(hijriMonth, hijriYear);
        hijriMonth++;
        if (hijriMonth > 12) {
            hijriMonth = 1;
            hijriYear++;
        }
    }
    
    while (hijriDay < 1) {
        hijriMonth--;
        if (hijriMonth < 1) {
            hijriMonth = 12;
            hijriYear--;
        }
        hijriDay += getMonthLength(hijriMonth, hijriYear);
    }
    
    return {
        day: Math.max(1, Math.min(30, hijriDay)),
        month: hijriMonth,
        year: hijriYear
    };
}

// Cache Hijri date to localStorage for offline persistence
function cacheHijriDate(hijriDay, hijriMonth, hijriYear, gregorianDate) {
    const cacheData = {
        hijriDay,
        hijriMonth,
        hijriYear,
        gregorianDate: gregorianDate.toISOString().split('T')[0],
        timestamp: Date.now()
    };
    localStorage.setItem('cachedHijriDate', JSON.stringify(cacheData));
}

// Get cached Hijri date and calculate current date from it
function getCachedHijriDate() {
    try {
        const cached = localStorage.getItem('cachedHijriDate');
        if (!cached) return null;
        
        const cacheData = JSON.parse(cached);
        const cachedGregorian = new Date(cacheData.gregorianDate);
        const now = new Date();
        
        // Calculate days since cached date
        const msPerDay = 24 * 60 * 60 * 1000;
        const daysDiff = Math.floor((now.getTime() - cachedGregorian.getTime()) / msPerDay);
        
        if (daysDiff === 0) {
            // Same day, return cached
            return {
                day: cacheData.hijriDay,
                month: cacheData.hijriMonth,
                year: cacheData.hijriYear
            };
        }
        
        // Calculate new Hijri date from cached reference
        let hijriDay = cacheData.hijriDay + daysDiff;
        let hijriMonth = cacheData.hijriMonth;
        let hijriYear = cacheData.hijriYear;
        
        function getMonthLength(month, year) {
            const isLeapYear = ((11 * year + 14) % 30) < 11;
            if (month === 12 && isLeapYear) return 30;
            return month % 2 === 1 ? 30 : 29;
        }
        
        // Normalize
        while (hijriDay > getMonthLength(hijriMonth, hijriYear)) {
            hijriDay -= getMonthLength(hijriMonth, hijriYear);
            hijriMonth++;
            if (hijriMonth > 12) {
                hijriMonth = 1;
                hijriYear++;
            }
        }
        
        return { day: hijriDay, month: hijriMonth, year: hijriYear };
    } catch (e) {
        console.log('Cache read error:', e);
        return null;
    }
}

// Update dates (auto-updates) - Hijri from Aladhan API with offline fallback
// Source: https://aladhan.com - The most reliable Islamic calendar API
// Uses Umm al-Qura calculation method - the official calendar of Saudi Arabia used in Makkah & Madina
async function updateDates() {
    const now = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    
    // Display Gregorian date
    const dateDisplay = document.getElementById('dateDisplay');
    if (dateDisplay) {
        dateDisplay.textContent = now.toLocaleDateString('en-US', dateOptions);
    }
    
    // Fetch Hijri date from Aladhan API - Umm al-Qura method (official Saudi/Makkah calendar)
    const hijriDateEl = document.getElementById('hijriDate');
    if (hijriDateEl) {
        let hijriDay, hijriMonth, hijriYear;
        let fromApi = false;
        
        // Check if online
        const isOnline = navigator.onLine;
        
        if (isOnline) {
            try {
                const dd = String(now.getDate()).padStart(2, '0');
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const yyyy = now.getFullYear();
                
                // Aladhan API - Umm al-Qura University, Makkah (official Saudi calendar)
                const apiUrl = `https://api.aladhan.com/v1/gToH/${dd}-${mm}-${yyyy}`;
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                
                const response = await fetch(apiUrl, {
                    signal: controller.signal,
                    headers: { 'Accept': 'application/json' }
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) throw new Error('API request failed');
                
                const data = await response.json();
                
                if (data.code === 200 && data.data && data.data.hijri) {
                    const hijri = data.data.hijri;
                    hijriDay = parseInt(hijri.day);
                    hijriMonth = parseInt(hijri.month.number);
                    hijriYear = parseInt(hijri.year);
                    fromApi = true;
                    
                    // Cache for offline use
                    cacheHijriDate(hijriDay, hijriMonth, hijriYear, now);
                } else {
                    throw new Error('Invalid API response');
                }
            } catch (error) {
                console.log('Hijri API error:', error.message);
                fromApi = false;
            }
        }
        
        // Offline fallback: use cached date or calculate locally
        if (!fromApi) {
            const cached = getCachedHijriDate();
            if (cached) {
                hijriDay = cached.day;
                hijriMonth = cached.month;
                hijriYear = cached.year;
                console.log('Using cached Hijri date');
            } else {
                // Calculate locally as last resort
                const calculated = calculateHijriDate(now);
                hijriDay = calculated.day;
                hijriMonth = calculated.month;
                hijriYear = calculated.year;
                console.log('Using calculated Hijri date');
            }
        }
        
        // Display the Hijri date
        if (hijriDay && hijriMonth && hijriYear) {
            hijriDateEl.textContent = `${hijriDay} ${hijriMonths[hijriMonth - 1]}, ${hijriYear} AH`;
            
            // Check for white days (13th, 14th, 15th of each month)
            if (hijriDay >= 13 && hijriDay <= 15) {
                checkAndCreateWhiteDaysNotification(hijriDay, hijriMonth, hijriYear, hijriMonths);
            }
        } else {
            hijriDateEl.textContent = 'Calculating...';
        }
    }
}

// Get all registered users (excluding passwords)
// Get all registered users from database or localStorage (fallback)
async function getAllRegisteredUsers() {
    // Try to get from database first
    try {
        const API_BASE_URL = window.API_BASE_URL || '/api';
        const response = await fetch(API_BASE_URL + '/get_all_users.php');
        const data = await response.json();
        
        if (data.success && data.users) {
            return data.users;
        }
    } catch (error) {
        console.log('Database not available, using localStorage:', error);
    }
    
    // Fallback to localStorage
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    // Return users without passwords for security
    return storedUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    });
}

// Send WhatsApp notification to a user
async function sendWhatsAppNotification(whatsappNumber, message) {
    if (!whatsappNumber) return false;
    
    try {
        // Clean the WhatsApp number (remove +, spaces, etc.)
        const cleanNumber = whatsappNumber.replace(/[^\d]/g, '');
        
        // Try to use backend API if available
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/send-whatsapp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: cleanNumber, message: message })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('WhatsApp notification sent via API:', data);
                return true;
            }
        } catch (apiError) {
            // Backend not available, fall back to localStorage method
            console.log('Backend API not available, using localStorage method');
        }
        
        // Fallback: Store notification for manual sending or use wa.me link
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
        console.log('WhatsApp notification prepared (fallback):', whatsappUrl);
        
        // Store notification in a queue for later processing
        let notificationQueue = JSON.parse(localStorage.getItem('whatsappNotificationQueue') || '[]');
        notificationQueue.push({
            number: cleanNumber,
            message: message,
            url: whatsappUrl,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('whatsappNotificationQueue', JSON.stringify(notificationQueue));
        
        return true;
    } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
        return false;
    }
}

// Send email notification to a user
async function sendEmailNotification(email, subject, message) {
    if (!email) return false;
    
    try {
        // Try to use backend API if available
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, subject, message })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Email notification sent via API:', data);
                return true;
            }
        } catch (apiError) {
            // Backend not available, fall back to localStorage method
            console.log('Backend API not available, using localStorage method');
        }
        
        // Fallback: Store notification for manual sending
        console.log('Email notification prepared (fallback):', { email, subject, message });
        
        // Store notification in a queue for later processing
        let notificationQueue = JSON.parse(localStorage.getItem('emailNotificationQueue') || '[]');
        notificationQueue.push({
            email: email,
            subject: subject,
            message: message,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('emailNotificationQueue', JSON.stringify(notificationQueue));
        
        return true;
    } catch (error) {
        console.error('Error sending email notification:', error);
        return false;
    }
}

// Send notifications to all registered users
async function sendNotificationsToAllUsers(subject, message, notificationId = null) {
    // Try to use backend API first (more efficient)
    try {
        const adminPassword = localStorage.getItem('adminPassword') || '';
        const API_BASE_URL = window.API_BASE_URL || '/api';
        
        const formData = new FormData();
        formData.append('subject', subject);
        formData.append('message', message);
        if (notificationId) {
            formData.append('notification_id', notificationId);
        }
        formData.append('admin_password', adminPassword);
        
        const response = await fetch(API_BASE_URL + '/send_notifications_to_all.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`Notifications sent via API: ${data.totalUsers} users, WhatsApp: ${data.whatsappSent}, Email: ${data.emailSent}`);
            return { 
                successCount: data.whatsappSent + data.emailSent, 
                failCount: data.whatsappFailed + data.emailFailed, 
                total: data.totalUsers 
            };
        }
    } catch (error) {
        console.log('Backend API not available, using fallback method:', error);
    }
    
    // Fallback: Get users and send individually
    const users = await getAllRegisteredUsers();
    let successCount = 0;
    let failCount = 0;
    
    console.log(`Sending notifications to ${users.length} users...`);
    
    for (const user of users) {
        // Send WhatsApp notification
        if (user.whatsapp) {
            const whatsappSuccess = await sendWhatsAppNotification(user.whatsapp, message);
            if (whatsappSuccess) {
                successCount++;
            } else {
                failCount++;
            }
        }
        
        // Send email notification
        if (user.email) {
            const emailSuccess = await sendEmailNotification(user.email, subject, message);
            if (emailSuccess) {
                successCount++;
            } else {
                failCount++;
            }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Notifications sent: ${successCount} successful, ${failCount} failed`);
    return { successCount, failCount, total: users.length };
}

// Check and create white days (ayyam al-beed) notification
function checkAndCreateWhiteDaysNotification(hijriDay, hijriMonth, hijriYear, hijriMonths) {
    // Create unique key for today's notification
    const todayKey = `whitedays-${hijriYear}-${hijriMonth}-${hijriDay}`;
    const lastNotificationKey = localStorage.getItem('lastWhiteDaysNotification');
    
    // Only create notification if not already created today
    if (lastNotificationKey === todayKey) {
        return;
    }
    
    // Calculate days until white days
    const daysUntil = 13 - hijriDay;
    const monthName = typeof hijriMonth === 'number' 
        ? hijriMonths[hijriMonth - 1] 
        : hijriMonth;
    
    // Create notification
    let notificationsData = JSON.parse(localStorage.getItem('notificationsData') || '[]');
    
    // Remove any existing white days notifications for this month to avoid duplicates
    notificationsData = notificationsData.filter(n => 
        !n.id || !n.id.startsWith('whitedays-') || !n.id.includes(`${hijriYear}-${hijriMonth}`)
    );
    
    // Create new notification
    const notification = {
        id: `whitedays-${Date.now()}`,
        title: 'Reminder: White Days Fasting (Ayyam al-Beed)',
        message: `Assalam Alaikum! This is a reminder that the White Days (13th, 14th, and 15th of ${monthName}) are ${daysUntil} day${daysUntil > 1 ? 's' : ''} away. Fasting on these three days is highly recommended (Sunnah). Please prepare to fast on the 13th, 14th, and 15th of ${monthName} ${hijriYear} AH. May Allah accept your good deeds.`,
        icon: 'fas fa-moon',
        status: 'unread',
        date: new Date().toISOString(),
        timeDisplay: 'Just now',
        isWhiteDaysNotification: true
    };
    
    notificationsData.unshift(notification);
    localStorage.setItem('notificationsData', JSON.stringify(notificationsData));
    
    // Mark today's notification as created
    localStorage.setItem('lastWhiteDaysNotification', todayKey);
    
    // Send notifications to all registered users via WhatsApp and Email
    const notificationSubject = 'Reminder: White Days Fasting (Ayyam al-Beed)';
    sendNotificationsToAllUsers(notificationSubject, notification.message)
        .then(result => {
            console.log('White days notifications sent to all users:', result);
        })
        .catch(error => {
            console.error('Error sending white days notifications:', error);
        });
    
    // If on notifications page, reload notifications
    if (window.location.pathname.includes('notifications.html') || window.location.href.includes('notifications.html')) {
        // Try to call loadNotificationsFromStorage if it exists
        if (typeof loadNotificationsFromStorage === 'function') {
            loadNotificationsFromStorage();
        } else {
            // If function doesn't exist yet, wait a bit and try again
            setTimeout(() => {
                if (typeof loadNotificationsFromStorage === 'function') {
                    loadNotificationsFromStorage();
                }
            }, 500);
        }
    }
    
    console.log('White days notification created for:', hijriDay, hijriMonth, hijriYear);
}

// Check and create fasting reminder notifications (Sunday/Wednesday at 2pm, 6pm, 7:40pm)
function checkAndCreateFastingReminder() {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 3 = Wednesday
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Check if it's Sunday (0) or Wednesday (3)
    if (currentDay !== 0 && currentDay !== 3) {
        return; // Not Sunday or Wednesday
    }
    
    // Define the reminder times: 14:00 (2pm), 18:00 (6pm), 19:40 (7:40pm)
    const reminderTimes = [
        { hour: 14, minute: 0 },   // 2:00 PM
        { hour: 18, minute: 0 },   // 6:00 PM
        { hour: 19, minute: 40 }   // 7:40 PM
    ];
    
    // Check if current time matches any reminder time (exact minute match)
    const isReminderTime = reminderTimes.some(time => {
        return currentHour === time.hour && currentMinute === time.minute;
    });
    
    if (!isReminderTime) {
        return; // Not a reminder time
    }
    
    // Determine the next day to fast
    const nextDayName = currentDay === 0 ? 'Monday' : 'Thursday'; // Sunday -> Monday, Wednesday -> Thursday
    const currentDateStr = now.toDateString(); // For unique key
    
    // Create unique key for this day and time
    const reminderKey = `fasting-reminder-${currentDateStr}-${currentHour}-${currentMinute}`;
    const lastReminderKey = localStorage.getItem('lastFastingReminder');
    
    // Only create notification if not already created for this specific time today
    if (lastReminderKey === reminderKey) {
        return;
    }
    
    // Get user name if logged in
    const userData = JSON.parse(localStorage.getItem('userData') || 'null');
    let userName = '';
    if (userData && userData.firstName) {
        userName = userData.firstName;
    } else if (userData && userData.name) {
        userName = userData.name.split(' ')[0]; // Use first name only
    }
    
    // Format the greeting with or without name
    const greeting = userName ? `Assalam Alaikum ${userName}!` : 'Assalam Alaikum!';
    
    // Create notification
    let notificationsData = JSON.parse(localStorage.getItem('notificationsData') || '[]');
    
    // Remove any existing fasting reminders for today to avoid duplicates
    const todayDateStr = now.toDateString();
    notificationsData = notificationsData.filter(n => 
        !n.id || !n.id.startsWith('fasting-reminder-') || !n.id.includes(todayDateStr)
    );
    
    // Create new notification
    const notification = {
        id: `fasting-reminder-${Date.now()}`,
        title: 'Reminder: Fasting Tomorrow',
        message: `${greeting} This is a reminder that tomorrow (${nextDayName}) is a recommended day for fasting. Please prepare to fast tomorrow. May Allah accept your good deeds.`,
        icon: 'fas fa-moon',
        status: 'unread',
        date: new Date().toISOString(),
        timeDisplay: 'Just now',
        isFastingReminder: true
    };
    
    notificationsData.unshift(notification);
    localStorage.setItem('notificationsData', JSON.stringify(notificationsData));
    
    // Mark this reminder as created
    localStorage.setItem('lastFastingReminder', reminderKey);
    
    // Send notifications to all registered users via WhatsApp and Email
    const notificationSubject = 'Reminder: Fasting Tomorrow';
    sendNotificationsToAllUsers(notificationSubject, notification.message)
        .then(result => {
            console.log('Fasting reminder notifications sent to all users:', result);
        })
        .catch(error => {
            console.error('Error sending fasting reminder notifications:', error);
        });
    
    // If on notifications page, reload notifications
    if (window.location.pathname.includes('notifications.html') || window.location.href.includes('notifications.html')) {
        if (typeof loadNotificationsFromStorage === 'function') {
            loadNotificationsFromStorage();
        } else {
            setTimeout(() => {
                if (typeof loadNotificationsFromStorage === 'function') {
                    loadNotificationsFromStorage();
                }
            }, 500);
        }
    }
    
    console.log('Fasting reminder notification created for:', nextDayName);
}

// Initialize fasting reminder checker - check every minute for the exact times
function initFastingReminderChecker() {
    // Check immediately on load
    checkAndCreateFastingReminder();
    
    // Then check every minute to catch the exact times (2pm, 6pm, 7:40pm)
    setInterval(checkAndCreateFastingReminder, 60000); // 1 minute = 60000ms
}

// Prayer times are now static in HTML - edit directly in index.html
// This function finds the next prayer and highlights it
function loadPrayerTimes() {
    // Read times directly from the HTML elements
    const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const prayerTimes = [];
    
    prayerNames.forEach(name => {
        const adhanEl = document.getElementById(name + 'Adhan');
        if (adhanEl) {
            prayerTimes.push({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                id: name,
                time: adhanEl.textContent.trim(),
                element: adhanEl.closest('.prayer-item')
            });
        }
    });
    
    if (prayerTimes.length === 0) return;
    
    // Find next prayer
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    let nextPrayer = null;
    let nextPrayerIndex = -1;
    
    // Find the first prayer that hasn't passed yet
    for (let i = 0; i < prayerTimes.length; i++) {
        const prayer = prayerTimes[i];
        const [hours, minutes] = prayer.time.split(':').map(Number);
        const prayerMinutes = hours * 60 + minutes;
        if (prayerMinutes > currentTime) {
            nextPrayer = prayer;
            nextPrayerIndex = i;
            break;
        }
    }
    
    // If all prayers have passed (after Isha), next prayer is Fajr (tomorrow)
    if (!nextPrayer) {
        nextPrayer = prayerTimes[0]; // Fajr
        nextPrayerIndex = 0;
    }
    
    // Remove active class from all prayer items and add to next prayer
    prayerTimes.forEach((prayer, index) => {
        if (prayer.element) {
            if (index === nextPrayerIndex) {
                prayer.element.classList.add('active');
            } else {
                prayer.element.classList.remove('active');
            }
        }
    });
    
    // Update next prayer display
    const nextPrayerTimeEl = document.getElementById('nextPrayerTime');
    if (nextPrayerTimeEl && nextPrayer) {
        nextPrayerTimeEl.textContent = nextPrayer.name + ' (' + nextPrayer.time + ')';
    }
}

// Update prayer highlight every minute
setInterval(loadPrayerTimes, 60000);

// Update dates on load and continuously (auto-update)
updateDates();
loadPrayerTimes();

// Initialize fasting reminder checker (checks every minute for Sunday/Wednesday at 2pm, 6pm, 7:40pm)
initFastingReminderChecker();

// Auto-update dates every hour (Hijri date changes daily, so hourly updates are sufficient)
// Respects API rate limits: 200 requests per 15 minutes, 1000 per hour
// This also checks for white days notifications
setInterval(updateDates, 3600000); // 1 hour = 3600000ms

// User Account System
let currentUser = null;

function loadUserData() {
    const userData = localStorage.getItem('userData');
    if (userData) {
        currentUser = JSON.parse(userData);
        updateUserDisplay();
        return true;
    }
    return false;
}

function updateUserDisplay() {
    // Update all userName elements across all pages
    const userNameEls = document.querySelectorAll('#userName');
    const accountIcon = document.getElementById('accountIcon');
    const accountIconBtn = document.getElementById('accountIconBtn');
    
    const userName = currentUser ? (currentUser.firstName || currentUser.name || 'Brother/Sister') : 'Brother/Sister';
    
    // Update all userName spans on the page
    userNameEls.forEach(el => {
        el.textContent = userName;
    });
    
    // Update bottom navigation - change Join to Settings when logged in
    const bottomNavItems = document.querySelectorAll('.bottom-nav .nav-item');
    bottomNavItems.forEach(item => {
        const span = item.querySelector('span');
        const icon = item.querySelector('i');
        if (span && (span.textContent === 'Join' || span.textContent === 'Settings')) {
            if (currentUser) {
                span.textContent = 'Settings';
                if (icon) icon.className = 'fas fa-cog';
            } else {
                span.textContent = 'Join';
                if (icon) icon.className = 'fas fa-user-plus';
            }
        }
    });
    
    // Update join-us page sections if on that page
    const notLoggedInSection = document.getElementById('notLoggedInSection');
    const loggedInSection = document.getElementById('loggedInSection');
    const settingsSection = document.getElementById('settingsSection');
    const welcomeUserName = document.getElementById('welcomeUserName');
    const pageTitle = document.querySelector('.page-title');
    
    if (currentUser) {
        if (notLoggedInSection) notLoggedInSection.style.display = 'none';
        if (loggedInSection) loggedInSection.style.display = 'block';
        if (settingsSection) settingsSection.style.display = 'block';
        if (welcomeUserName) welcomeUserName.textContent = 'Welcome, ' + (currentUser.firstName || currentUser.name || 'Member') + '!';
        if (pageTitle && window.location.pathname.includes('join-us')) {
            pageTitle.textContent = 'Settings & Profile';
        }
        // Change icon to show logged in state
        if (accountIcon) {
            accountIcon.className = 'fas fa-user-circle logged-in';
        }
        if (accountIconBtn) {
            accountIconBtn.classList.add('logged-in');
            accountIconBtn.title = 'Account';
        }
    } else {
        if (notLoggedInSection) notLoggedInSection.style.display = 'block';
        if (loggedInSection) loggedInSection.style.display = 'none';
        if (settingsSection) settingsSection.style.display = 'none';
        if (pageTitle && window.location.pathname.includes('join-us')) {
            pageTitle.textContent = 'Join Our Community';
        }
        // Show login icon
        if (accountIcon) {
            accountIcon.className = 'fas fa-user-circle';
        }
        if (accountIconBtn) {
            accountIconBtn.classList.remove('logged-in');
            accountIconBtn.title = 'Login / Create Account';
        }
    }
}

// Inject account modal into pages that don't have it
function injectAccountModal() {
    if (document.getElementById('accountModal')) return; // Already exists
    
    const modalHTML = `
    <!-- Account Modal (Login/Create Account/Account Info) -->
    <div class="modal-overlay" id="accountModal" style="display: none;">
        <div class="modal-content account-modal">
            <!-- Login/Signup Tabs -->
            <div id="accountTabs" style="display: none;">
                <div class="account-tabs">
                    <button class="account-tab active" id="loginTab" onclick="showLoginTab()">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </button>
                    <button class="account-tab" id="signupTab" onclick="showSignupTab()">
                        <i class="fas fa-user-plus"></i> Create Account
                    </button>
                </div>
            </div>

            <div class="modal-header">
                <h3 id="accountModalTitle"><i class="fas fa-user-circle"></i> Account</h3>
                <button class="modal-close" onclick="closeAccountModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="modal-body">
                <!-- Login Form -->
                <form id="loginFormElement" onsubmit="handleLogin(event)" style="display: none;">
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" id="loginEmail" placeholder="your.email@example.com" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" class="form-input" id="loginPassword" placeholder="Enter your password" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 15px;">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </button>
                    <p style="text-align: center; margin-top: 15px; font-size: 14px; color: var(--text-gray);">
                        Don't have an account? <a href="#" onclick="showSignupTab(); return false;" style="color: var(--primary-green); font-weight: 600;">Create one</a>
                    </p>
                </form>

                <!-- Signup Form -->
                <form id="signupFormElement" onsubmit="handleSignup(event)" style="display: none;">
                    <div class="form-group">
                        <label class="form-label">First Name</label>
                        <input type="text" class="form-input" id="signupFirstName" placeholder="Enter your first name" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Last Name</label>
                        <input type="text" class="form-input" id="signupLastName" placeholder="Enter your last name" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" id="signupEmail" placeholder="your.email@example.com" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Phone Number</label>
                        <input type="tel" class="form-input" id="signupPhone" placeholder="07XX XXX XXX" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Reg Number</label>
                        <input type="text" class="form-input" id="signupRegNo" placeholder="Enter your registration number">
                    </div>
                    <div class="form-group">
                        <label class="form-label">WhatsApp Number</label>
                        <input type="tel" class="form-input" id="signupWhatsApp" placeholder="+256 703 268 522" required>
                        <p style="font-size: 12px; color: var(--text-gray); margin-top: 5px;">Include country code (e.g., +256)</p>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Gender</label>
                        <select class="form-input" id="signupGender" required>
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Position</label>
                        <select class="form-input" id="signupPosition" required>
                            <option value="">Select your position</option>
                            <option value="Student">Student</option>
                            <option value="Lecturer">Lecturer</option>
                            <option value="Staff">Staff</option>
                            <option value="Alumni">Alumni</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" class="form-input" id="signupPassword" placeholder="At least 6 characters" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirm Password</label>
                        <input type="password" class="form-input" id="signupConfirmPassword" placeholder="Confirm your password" required minlength="6">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 15px;">
                        <i class="fas fa-user-plus"></i> Create Account
                    </button>
                    <p style="text-align: center; margin-top: 15px; font-size: 14px; color: var(--text-gray);">
                        Already have an account? <a href="#" onclick="showLoginTab(); return false;" style="color: var(--primary-green); font-weight: 600;">Login</a>
                    </p>
                </form>

                <!-- Account Info -->
                <div id="accountInfo" style="display: none;">
                    <div class="account-info-card">
                        <div class="account-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <h3 id="accountName" style="text-align: center; margin: 15px 0 5px 0; color: var(--dark-gray);"></h3>
                        <p style="text-align: center; color: var(--text-gray); margin-bottom: 20px;">
                            <i class="fas fa-envelope"></i> <span id="accountEmail"></span>
                        </p>
                        <p style="text-align: center; color: var(--text-gray); margin-bottom: 10px;">
                            <i class="fas fa-venus-mars"></i> <span id="accountGender"></span>
                        </p>
                        <p style="text-align: center; color: var(--text-gray); margin-bottom: 20px;">
                            <i class="fas fa-briefcase"></i> <span id="accountPosition"></span>
                        </p>
                        <button class="btn btn-primary" onclick="showEditProfile()" style="width: 100%; margin-bottom: 10px;">
                            <i class="fas fa-edit"></i> Edit Profile
                        </button>
                        <button class="btn btn-secondary" onclick="handleLogout()" style="width: 100%;">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>

                <!-- Edit Profile Form -->
                <div id="editProfileForm" style="display: none;">
                    <div class="form-group">
                        <label class="form-label">First Name</label>
                        <input type="text" class="form-input" id="editFirstName" placeholder="First name" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Last Name</label>
                        <input type="text" class="form-input" id="editLastName" placeholder="Last name" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Phone Number</label>
                        <input type="tel" class="form-input" id="editPhone" placeholder="07XX XXX XXX">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Reg Number</label>
                        <input type="text" class="form-input" id="editRegNo" placeholder="Enter your registration number">
                    </div>
                    <div class="form-group">
                        <label class="form-label">WhatsApp Number</label>
                        <input type="tel" class="form-input" id="editWhatsApp" placeholder="+256 7XX XXX XXX">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Position</label>
                        <select class="form-input" id="editPosition">
                            <option value="">Select position</option>
                            <option value="Student">Student</option>
                            <option value="Lecturer">Lecturer</option>
                            <option value="Staff">Staff</option>
                            <option value="Alumni">Alumni</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button type="button" class="btn btn-secondary" onclick="hideEditProfile()" style="flex: 1;">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button type="button" class="btn btn-primary" onclick="saveProfileChanges()" style="flex: 1;">
                            <i class="fas fa-save"></i> Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add click handler to close modal on overlay click
    const modal = document.getElementById('accountModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAccountModal();
            }
        });
    }
}

// Initialize user data on page load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', function() {
        injectAccountModal();
        loadUserData();
    });
}

// Make functions globally accessible
window.showLoginModal = function() {
    const modal = document.getElementById('accountModal');
    if (modal) {
        document.getElementById('accountTabs').style.display = 'block';
        document.getElementById('accountModalTitle').innerHTML = '<i class="fas fa-user-circle"></i> Account';
        document.getElementById('loginTab').classList.add('active');
        document.getElementById('signupTab').classList.remove('active');
        document.getElementById('loginFormElement').style.display = 'block';
        document.getElementById('signupFormElement').style.display = 'none';
        document.getElementById('accountInfo').style.display = 'none';
        modal.style.display = 'flex';
    }
};

window.toggleAccountModal = function() {
    const modal = document.getElementById('accountModal');
    if (modal) {
        if (currentUser) {
            // Show account info/logout
            window.showAccountInfo();
        } else {
            // Show login/create account
            window.showLoginModal();
        }
    } else {
        console.error('Account modal not found');
    }
};

window.showSignupTab = function() {
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('signupTab').classList.add('active');
    document.getElementById('loginFormElement').style.display = 'none';
    document.getElementById('signupFormElement').style.display = 'block';
};

window.showLoginTab = function() {
    document.getElementById('loginTab').classList.add('active');
    document.getElementById('signupTab').classList.remove('active');
    document.getElementById('loginFormElement').style.display = 'block';
    document.getElementById('signupFormElement').style.display = 'none';
};

window.closeAccountModal = function() {
    const modal = document.getElementById('accountModal');
    if (modal) {
        modal.style.display = 'none';
        // Reset forms
        document.getElementById('loginFormElement')?.reset();
        document.getElementById('signupFormElement')?.reset();
    }
};

window.handleLogin = async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    }
    
    try {
        // Sign in with Firebase Auth
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;
        
        // Set basic user data first
        currentUser = { uid: firebaseUser.uid, email: firebaseUser.email, name: firebaseUser.displayName || email.split('@')[0] };
        
        // Try to get additional user data from Firestore (silently fail if no permissions)
        try {
            const userDoc = await firebase.firestore().collection('users').doc(firebaseUser.uid).get();
            if (userDoc.exists) {
                currentUser = { uid: firebaseUser.uid, email: firebaseUser.email, ...userDoc.data() };
            }
        } catch (e) {
            // Silently ignore Firestore permission errors
        }
        
        localStorage.setItem('userData', JSON.stringify(currentUser));
        localStorage.setItem('kiuma_user', JSON.stringify(currentUser));
        updateUserDisplay();
        if (typeof updateJoinPageUI === 'function') {
            updateJoinPageUI();
        }
        window.closeAccountModal();
        alert('Welcome back, ' + (currentUser.firstName || currentUser.name || 'User') + '!');
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. Please try again.';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email. Please sign up first.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password. Please try again.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Please try again later.';
        }
        alert(errorMessage);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        }
    }
};

window.handleSignup = async function(e) {
    e.preventDefault();
    const firstName = document.getElementById('signupFirstName').value;
    const lastName = document.getElementById('signupLastName').value;
    const email = document.getElementById('signupEmail').value;
    const phone = document.getElementById('signupPhone')?.value || '';
    const regNo = document.getElementById('signupRegNo')?.value || '';
    const whatsapp = document.getElementById('signupWhatsApp').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const gender = document.getElementById('signupGender').value;
    const position = document.getElementById('signupPosition')?.value || '';
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
    }
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    }
    
    try {
        console.log('Starting signup process...');
        
        // Create user with Firebase Auth
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;
        console.log('Firebase user created:', firebaseUser.uid);
        
        // Update display name
        await firebaseUser.updateProfile({
            displayName: firstName + ' ' + lastName
        });
        console.log('Display name updated');
        
        // Create user data object
        const userData = {
            uid: firebaseUser.uid,
            firstName: firstName,
            lastName: lastName,
            name: firstName + ' ' + lastName,
            email: email,
            phone: phone,
            regNo: regNo,
            whatsapp: whatsapp,
            gender: gender,
            position: position,
            createdAt: new Date().toISOString()
        };
        
        // Try to save to Firestore (optional - don't fail if it doesn't work)
        try {
            await firebase.firestore().collection('users').doc(firebaseUser.uid).set({
                ...userData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('User saved to Firestore');
        } catch (firestoreError) {
            console.warn('Firestore save failed (continuing anyway):', firestoreError);
        }
        
        currentUser = userData;
        localStorage.setItem('userData', JSON.stringify(currentUser));
        localStorage.setItem('kiuma_user', JSON.stringify(currentUser));
        updateUserDisplay();
        if (typeof updateJoinPageUI === 'function') {
            updateJoinPageUI();
        }
        window.closeAccountModal();
        alert('Account created successfully! Welcome, ' + firstName + '!');
    } catch (error) {
        console.error('Signup error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        let errorMessage = 'Signup failed. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already registered. Please login instead.';
            window.showLoginTab();
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Please use a stronger password.';
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage = 'Email/Password sign-in is not enabled. Please enable it in Firebase Console.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your internet connection.';
        } else {
            errorMessage = 'Error: ' + (error.message || error.code || 'Unknown error');
        }
        alert(errorMessage);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        }
    }
};

window.showAccountInfo = function() {
    const modal = document.getElementById('accountModal');
    if (modal) {
        document.getElementById('accountTabs').style.display = 'none';
        document.getElementById('accountModalTitle').innerHTML = '<i class="fas fa-user-circle"></i> My Account';
        document.getElementById('loginFormElement').style.display = 'none';
        document.getElementById('signupFormElement').style.display = 'none';
        document.getElementById('accountInfo').style.display = 'block';
        
        if (currentUser) {
            document.getElementById('accountName').textContent = currentUser.name || (currentUser.firstName + ' ' + currentUser.lastName);
            document.getElementById('accountEmail').textContent = currentUser.email;
            document.getElementById('accountGender').textContent = currentUser.gender || 'Not specified';
            const positionEl = document.getElementById('accountPosition');
            if (positionEl) {
                positionEl.textContent = currentUser.position || 'Not specified';
            }
        }
        
        modal.style.display = 'flex';
    }
}

window.handleLogout = async function() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            await firebase.auth().signOut();
            currentUser = null;
            localStorage.removeItem('userData');
            updateUserDisplay();
            window.closeAccountModal();
            alert('You have been logged out.');
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear local data even if Firebase logout fails
            currentUser = null;
            localStorage.removeItem('userData');
            updateUserDisplay();
            window.closeAccountModal();
        }
    }
};

// Edit Profile Functions
window.showEditProfile = function() {
    console.log('showEditProfile called');
    const modal = document.getElementById('accountModal');
    const editForm = document.getElementById('editProfileForm');
    const accountInfo = document.getElementById('accountInfo');
    const accountInfoCard = document.querySelector('.account-info-card');
    
    // Get user from multiple sources
    let user = currentUser;
    if (!user) {
        try {
            const stored = localStorage.getItem('userData');
            if (stored) user = JSON.parse(stored);
        } catch (e) {}
    }
    if (!user) {
        try {
            const stored = localStorage.getItem('kiuma_user');
            if (stored) user = JSON.parse(stored);
        } catch (e) {}
    }
    
    if (!editForm) {
        alert('Edit form not found. Please refresh the page.');
        return;
    }
    
    if (!user) {
        alert('Please log in first to edit your profile.');
        return;
    }
    
    // Ensure account modal is visible (some pages trigger edit without opening modal)
    if (modal) {
        modal.style.display = 'flex';
    }
 
    // Hide account info (different pages structure differently)
    if (accountInfo) accountInfo.style.display = 'none';
    if (accountInfoCard) accountInfoCard.style.display = 'none';
    
    // Populate form with current user data
    const firstNameEl = document.getElementById('editFirstName');
    const lastNameEl = document.getElementById('editLastName');
    const phoneEl = document.getElementById('editPhone');
    const regNoEl = document.getElementById('editRegNo');
    const whatsAppEl = document.getElementById('editWhatsApp');
    const positionEl = document.getElementById('editPosition');
    
    if (firstNameEl) firstNameEl.value = user.firstName || '';
    if (lastNameEl) lastNameEl.value = user.lastName || '';
    if (phoneEl) phoneEl.value = user.phone || user.phoneNumber || '';
    if (regNoEl) regNoEl.value = user.regNo || user.registrationNumber || '';
    if (whatsAppEl) whatsAppEl.value = user.whatsapp || '';
    if (positionEl) positionEl.value = user.position || '';
    
    editForm.style.display = 'block';
};

window.hideEditProfile = function() {
    const editForm = document.getElementById('editProfileForm');
    const accountInfo = document.getElementById('accountInfo');
    const accountInfoCard = document.querySelector('.account-info-card');
    if (editForm) {
        editForm.style.display = 'none';
    }
    // Restore account info UI depending on page structure
    if (accountInfo) accountInfo.style.display = 'block';
    if (accountInfoCard) accountInfoCard.style.display = 'block';
};

window.saveProfileChanges = async function() {
    // Get current user from multiple sources for reliability
    let user = currentUser;
    if (!user) {
        try {
            const stored = localStorage.getItem('userData');
            if (stored) user = JSON.parse(stored);
        } catch (e) {}
    }
    if (!user) {
        try {
            const stored = localStorage.getItem('kiuma_user');
            if (stored) user = JSON.parse(stored);
        } catch (e) {}
    }
    
    if (!user) {
        alert('Please log in first to edit your profile.');
        return;
    }
    
    const firstNameEl = document.getElementById('editFirstName');
    const lastNameEl = document.getElementById('editLastName');
    const phoneEl = document.getElementById('editPhone');
    const regNoEl = document.getElementById('editRegNo');
    const whatsappEl = document.getElementById('editWhatsApp');
    const positionEl = document.getElementById('editPosition');
    
    if (!firstNameEl || !lastNameEl) {
        alert('Profile form not found. Please refresh the page.');
        return;
    }
    
    const firstName = firstNameEl.value.trim();
    const lastName = lastNameEl.value.trim();
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const regNo = regNoEl ? regNoEl.value.trim() : '';
    const whatsapp = whatsappEl ? whatsappEl.value.trim() : '';
    const position = positionEl ? positionEl.value.trim() : '';
    const saveBtn = document.querySelector('#editProfileForm button.btn-primary');
    
    if (!firstName || !lastName) {
        alert('First name and last name are required.');
        return;
    }
    
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }
    
    let firestoreSuccess = false;
    let authSuccess = false;
    
    try {
        // Always update local data first (works offline)
        user.firstName = firstName;
        user.lastName = lastName;
        user.name = firstName + ' ' + lastName;
        user.phone = phone;
        user.regNo = regNo;
        user.whatsapp = whatsapp;
        user.position = position;
        user.updatedAt = new Date().toISOString();
        
        // Save to all localStorage keys for reliability
        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('kiuma_user', JSON.stringify(user));
        
        // Update global currentUser
        currentUser = user;
        
        // Try Firestore update (may fail if offline)
        if (user.uid && typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                await firebase.firestore().collection('users').doc(user.uid).set({
                    firstName: firstName,
                    lastName: lastName,
                    name: firstName + ' ' + lastName,
                    phone: phone,
                    regNo: regNo,
                    whatsapp: whatsapp,
                    position: position,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                firestoreSuccess = true;
            } catch (fsError) {
                console.warn('Firestore update failed (will sync when online):', fsError);
            }
        }
        
        // Try Firebase Auth update
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const authUser = firebase.auth().currentUser;
            if (authUser) {
                try {
                    await authUser.updateProfile({ displayName: firstName + ' ' + lastName });
                    authSuccess = true;
                } catch (authError) {
                    console.warn('Auth profile update failed:', authError);
                }
            }
        }
        
        // Update display elements
        const accountNameEl = document.getElementById('accountName');
        if (accountNameEl) accountNameEl.textContent = user.name;
        
        const accountPosEl = document.getElementById('accountPosition');
        if (accountPosEl) accountPosEl.textContent = position || 'Not specified';
        
        // Hide edit form
        window.hideEditProfile();
        
        // Update user display on page
        if (typeof updateUserDisplay === 'function') {
            updateUserDisplay();
        }

        if (typeof updateJoinPageUI === 'function') {
            updateJoinPageUI();
        }
        
        // Show success with sync status
        if (firestoreSuccess) {
            showToast('Profile updated and synced!', 'success', 2000);
        } else if (navigator.onLine) {
            showToast('Profile saved locally. Sync may have failed.', 'warning', 3000);
        } else {
            showToast('Profile saved offline. Will sync when online.', 'success', 2000);
        }
        
    } catch (error) {
        console.error('Profile update error:', error);
        alert('Failed to update profile: ' + error.message);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        }
    }
};

// Navigation function
function navigateTo(url) {
    window.location.href = url;
}

// Navigate to Kizumu Visit - Show Activities Modal
function navigateToKizumuVisit() {
    showActivitiesModal();
}

function showActivitiesModal() {
    const modal = document.getElementById('activitiesModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeActivitiesModal() {
    const modal = document.getElementById('activitiesModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function navigateToActivity(type) {
    closeActivitiesModal();
    
    if (type === 'kizumu-visit') {
        window.location.href = 'activities.html#charity-visit';
    } else if (type === 'tuition-brothers') {
        window.location.href = 'pay.html?type=charity&donation=tuition-brothers';
    } else if (type === 'activities') {
        window.location.href = 'activities.html';
    }
}

// Initialize modal close on overlay click for all pages
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('activitiesModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeActivitiesModal();
            }
        });
    }
});

// Search functionality
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value;
            if (query.trim()) {
                // Simple search - can be enhanced
                alert('Searching for: ' + query);
            }
        }
    });
}

// Notifications button
const notificationsBtn = document.getElementById('notificationsBtn');
if (notificationsBtn) {
    notificationsBtn.addEventListener('click', () => {
        window.location.href = 'notifications.html';
    });
}

let cacheRefreshInProgress = false;
const FRESH_LOAD_FLAG = 'appFreshReloaded';
const NOTIFICATION_POLL_INTERVAL = 90 * 1000;
let notificationPollTimer = null;

function getAllStoredNotifications() {
    let notifications = [];
    try {
        const stored = JSON.parse(localStorage.getItem('notificationsData') || '[]');
        notifications = Array.isArray(stored) ? stored : [];
    } catch (error) {
        console.warn('Unable to parse notifications from storage', error);
    }
    return notifications;
}

function isNotificationUnread(notification) {
    if (!notification) return false;
    // Check local read status first (stored per-device)
    const readIds = getLocalReadNotificationIds();
    if (readIds.includes(notification.id)) return false;
    // If not locally marked as read, check notification properties
    if (typeof notification.is_read !== 'undefined') {
        return notification.is_read === 0 || notification.is_read === false;
    }
    const status = (notification.status || '').toLowerCase();
    // Default to unread if status is 'unread' or empty
    return status === 'unread' || status === '';
}

function getLocalReadNotificationIds() {
    try {
        return JSON.parse(localStorage.getItem('readNotificationIds') || '[]');
    } catch (e) {
        return [];
    }
}

function markNotificationAsRead(id) {
    const readIds = getLocalReadNotificationIds();
    if (!readIds.includes(id)) {
        readIds.push(id);
        localStorage.setItem('readNotificationIds', JSON.stringify(readIds));
        updateNotificationBadge();
    }
}
window.markNotificationAsRead = markNotificationAsRead;

function updateNotificationBadge() {
    const badgeElements = document.querySelectorAll('.notifications-btn .badge');
    if (!badgeElements.length) return;
    const notifications = getAllStoredNotifications();
    const unreadCount = notifications.filter(isNotificationUnread).length;
    badgeElements.forEach(badge => {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'inline-flex';
        } else {
            badge.textContent = '';
            badge.style.display = 'none';
        }
    });
    // Also update any standalone badge elements
    const standaloneBadges = document.querySelectorAll('[data-notification-badge]');
    standaloneBadges.forEach(badge => {
        badge.textContent = unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : '';
        badge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
    });
}
window.updateNotificationBadge = updateNotificationBadge;

async function fetchNotificationsForBadge() {
    // Show badge immediately from cached data (no flash)
    updateNotificationBadge();
    try {
        // Wait for Firebase to be ready (up to 3s)
        const start = Date.now();
        while (!window.firebaseDb && (Date.now() - start) < 3000) {
            await new Promise(r => setTimeout(r, 200));
        }
        const db = window.firebaseDb;
        if (!db) return;
        const snapshot = await db.collection('notifications').orderBy('createdAt', 'desc').limit(50).get();
        const notifs = [];
        snapshot.forEach(function(doc) {
            const d = doc.data();
            notifs.push({
                id: doc.id,
                title: d.title || 'Notification',
                message: d.message || '',
                category: d.category || 'general',
                icon: d.icon || 'fas fa-bell',
                status: d.status || 'unread',
                is_read: d.is_read || 0,
                createdAt: d.createdAt ? (typeof d.createdAt.toDate === 'function' ? d.createdAt.toDate().toISOString() : d.createdAt) : new Date().toISOString()
            });
        });
        // Only update cache if Firestore returned data (don't clear on empty/error)
        if (notifs.length > 0) {
            localStorage.setItem('notificationsData', JSON.stringify(notifs));
        }
    } catch (error) {
        console.warn('Unable to fetch notifications from Firestore:', error);
    } finally {
        updateNotificationBadge();
    }
}

function initNotificationBadgeListener() {
    // Immediate badge update from cache (synchronous, no flash)
    updateNotificationBadge();
    // Then fetch fresh data from Firestore
    fetchNotificationsForBadge();
    if (notificationPollTimer) {
        clearInterval(notificationPollTimer);
    }
    notificationPollTimer = setInterval(fetchNotificationsForBadge, NOTIFICATION_POLL_INTERVAL);
}

async function enforceFreshAssetsOnLoad() {
    if (!navigator.onLine || cacheRefreshInProgress) return;
    cacheRefreshInProgress = true;
    try {
        if (!('serviceWorker' in navigator)) return;
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;
        await registration.update().catch(() => {});
        // If a new worker is waiting, show the update banner instead of force-reloading
        if (registration.waiting && typeof showUpdateBanner === 'function') {
            showUpdateBanner(registration.waiting);
        }
    } catch (error) {
        console.warn('Failed to check for updates:', error);
    } finally {
        cacheRefreshInProgress = false;
    }
}

window.addEventListener('online', () => enforceFreshAssetsOnLoad());

// Active navigation item
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link, .nav-item');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });

    try {
        initNotificationBadgeListener();
    } catch (e) {
        // fallback: at least update badge once from cache
        try { updateNotificationBadge(); } catch(e2) {}
    }

    enforceFreshAssetsOnLoad();
});

// Old localStorage login/signup handlers removed - using Firebase Auth (window.handleLogin and window.handleSignup above)

// Payment method selection
function selectPaymentMethod(method) {
    const methods = document.querySelectorAll('.payment-method');
    methods.forEach(m => m.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    const selectedMethod = event.currentTarget.dataset.method;
    localStorage.setItem('selectedPaymentMethod', selectedMethod);
}

// Initialize payment method selection
document.addEventListener('DOMContentLoaded', () => {
    const paymentMethods = document.querySelectorAll('.payment-method');
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            paymentMethods.forEach(m => m.classList.remove('active'));
            this.classList.add('active');
        });
    });

});

