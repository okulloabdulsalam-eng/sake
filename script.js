// Navigation Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const navClose = document.getElementById('navClose');
const overlay = document.createElement('div');
overlay.className = 'overlay';
document.body.appendChild(overlay);

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

// Prayer Times Calculation (simplified)
function updatePrayerTimes() {
    // Get current date
    const now = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    
    // Display current date
    const dateDisplay = document.getElementById('dateDisplay');
    if (dateDisplay) {
        dateDisplay.textContent = now.toLocaleDateString('en-US', dateOptions);
    }
    
    // Calculate Hijri date (simplified)
    const hijriDate = document.getElementById('hijriDate');
    if (hijriDate) {
        // Simplified calculation - in production, use a proper Hijri calendar library
        const hijriYear = Math.floor((now.getFullYear() - 621.5643) / 0.970224);
        const hijriMonth = ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 
                           'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 
                           'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'];
        const hijriDay = Math.floor((now.getTime() - new Date(hijriYear, 0, 1).getTime()) / (24 * 60 * 60 * 1000));
        hijriDate.textContent = `${hijriMonth[now.getMonth()]} ${now.getDate()}, ${hijriYear} AH`;
    }
    
    // Simplified prayer times (should use location-based calculation in production)
    const prayers = {
        fajr: '05:30',
        dhuhr: '12:15',
        asr: '15:45',
        maghrib: '18:20',
        isha: '19:45'
    };
    
    // Update prayer times
    if (document.getElementById('fajrTime')) document.getElementById('fajrTime').textContent = prayers.fajr;
    if (document.getElementById('dhuhrTime')) document.getElementById('dhuhrTime').textContent = prayers.dhuhr;
    if (document.getElementById('asrTime')) document.getElementById('asrTime').textContent = prayers.asr;
    if (document.getElementById('maghribTime')) document.getElementById('maghribTime').textContent = prayers.maghrib;
    if (document.getElementById('ishaTime')) document.getElementById('ishaTime').textContent = prayers.isha;
    
    // Find next prayer
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const prayerTimes = [
        { name: 'Fajr', time: '05:30' },
        { name: 'Dhuhr', time: '12:15' },
        { name: 'Asr', time: '15:45' },
        { name: 'Maghrib', time: '18:20' },
        { name: 'Isha', time: '19:45' }
    ];
    
    let nextPrayer = prayerTimes[prayerTimes.length - 1];
    for (let prayer of prayerTimes) {
        const [hours, minutes] = prayer.time.split(':').map(Number);
        const prayerMinutes = hours * 60 + minutes;
        if (prayerMinutes > currentTime) {
            nextPrayer = prayer;
            break;
        }
    }
    
    const nextPrayerTime = document.getElementById('nextPrayerTime');
    if (nextPrayerTime) {
        nextPrayerTime.textContent = nextPrayer.name + ' (' + nextPrayer.time + ')';
    }
}

// Update prayer times on load
updatePrayerTimes();

// Set user name from localStorage or default
const userName = localStorage.getItem('userName') || 'Brother/Sister';
if (document.getElementById('userName')) {
    document.getElementById('userName').textContent = userName;
}

// Navigation function
function navigateTo(url) {
    window.location.href = url;
}

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
});

// Form submission handlers
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Simple validation
    if (username && password) {
        localStorage.setItem('userName', username);
        alert('Login successful!');
        window.location.href = 'index.html';
    } else {
        alert('Please fill in all fields');
    }
}

function handleSignup(e) {
    e.preventDefault();
    const formData = {
        firstName: document.getElementById('firstName')?.value,
        lastName: document.getElementById('lastName')?.value,
        userName: document.getElementById('userName')?.value,
        password: document.getElementById('password')?.value,
        dateOfBirth: document.getElementById('dateOfBirth')?.value
    };
    
    // Simple validation
    if (Object.values(formData).every(val => val)) {
        localStorage.setItem('userName', formData.firstName);
        alert('Registration successful!');
        window.location.href = 'index.html';
    } else {
        alert('Please fill in all fields');
    }
}

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

