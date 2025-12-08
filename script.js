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
    
    // Load prayer times from localStorage or use defaults
    const defaultPrayers = {
        fajr: { adhan: '05:30', iqaama: '05:40' },
        dhuhr: { adhan: '12:15', iqaama: '12:25' },
        asr: { adhan: '15:45', iqaama: '15:55' },
        maghrib: { adhan: '18:20', iqaama: '18:25' },
        isha: { adhan: '19:45', iqaama: '19:55' }
    };
    
    const storedPrayers = JSON.parse(localStorage.getItem('prayerTimes')) || defaultPrayers;
    
    // Update prayer times display
    Object.keys(storedPrayers).forEach(prayer => {
        const adhanEl = document.getElementById(prayer + 'Adhan');
        const iqaamaEl = document.getElementById(prayer + 'Iqaama');
        if (adhanEl) adhanEl.textContent = storedPrayers[prayer].adhan;
        if (iqaamaEl) iqaamaEl.textContent = storedPrayers[prayer].iqaama;
    });
    
    // Find next prayer (using adhan time)
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const prayerTimes = [
        { name: 'Fajr', time: storedPrayers.fajr.adhan },
        { name: 'Dhuhr', time: storedPrayers.dhuhr.adhan },
        { name: 'Asr', time: storedPrayers.asr.adhan },
        { name: 'Maghrib', time: storedPrayers.maghrib.adhan },
        { name: 'Isha', time: storedPrayers.isha.adhan }
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
    } else if (type === 'kisilaahe') {
        window.location.href = 'activities.html#kisilaahe';
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

    // Initialize prayer times editing
    initializePrayerTimesEditing();
});

// Admin Password (in production, this should be stored securely on the backend)
const ADMIN_PASSWORD = 'kiuma2024'; // Change this to your desired password

// Check if admin is logged in from localStorage
let isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true' || false;

function showAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'flex';
    document.getElementById('adminPassword').value = '';
    document.getElementById('passwordError').style.display = 'none';
}

function closeAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'none';
    document.getElementById('adminPassword').value = '';
    document.getElementById('passwordError').style.display = 'none';
}

function verifyAdminPassword() {
    const password = document.getElementById('adminPassword').value;
    if (password === ADMIN_PASSWORD) {
        isAdminLoggedIn = true;
        localStorage.setItem('isAdminLoggedIn', 'true');
        closeAdminLogin();
        enableEditing();
        checkAdminStatus(); // Update UI for notifications/media pages
        alert('Admin mode enabled. You can now edit content.');
    } else {
        document.getElementById('passwordError').style.display = 'block';
        document.getElementById('adminPassword').value = '';
    }
}

function logoutAdmin() {
    isAdminLoggedIn = false;
    localStorage.removeItem('isAdminLoggedIn');
    checkAdminStatus();
    alert('Logged out of admin mode.');
}

function checkAdminStatus() {
    // Update UI elements based on admin status
    const adminButtons = document.querySelectorAll('.admin-only');
    adminButtons.forEach(btn => {
        btn.style.display = isAdminLoggedIn ? 'block' : 'none';
    });
    
    const adminLogoutBtns = document.querySelectorAll('.admin-logout');
    adminLogoutBtns.forEach(btn => {
        btn.style.display = isAdminLoggedIn ? 'block' : 'none';
    });
}

function enableEditing() {
    const editableElements = document.querySelectorAll('.editable');
    editableElements.forEach(el => {
        el.contentEditable = 'true';
        el.classList.add('editing');
    });
    
    // Update edit button
    const editBtn = document.getElementById('adminEditBtn');
    editBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    editBtn.onclick = savePrayerTimes;
    
    // Add save/cancel buttons
    if (!document.getElementById('saveCancelBtns')) {
        const btnContainer = document.createElement('div');
        btnContainer.id = 'saveCancelBtns';
        btnContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 15px;';
        btnContainer.innerHTML = `
            <button class="btn btn-primary" onclick="savePrayerTimes()" style="flex: 1;">
                <i class="fas fa-save"></i> Save
            </button>
            <button class="btn btn-secondary" onclick="cancelEditing()" style="flex: 1;">
                <i class="fas fa-times"></i> Cancel
            </button>
        `;
        document.getElementById('prayerTimesList').appendChild(btnContainer);
    }
}

function cancelEditing() {
    isAdminLoggedIn = false;
    const editableElements = document.querySelectorAll('.editable');
    editableElements.forEach(el => {
        el.contentEditable = 'false';
        el.classList.remove('editing');
    });
    
    // Reload prayer times
    updatePrayerTimes();
    
    // Update edit button
    const editBtn = document.getElementById('adminEditBtn');
    editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Times';
    editBtn.onclick = showAdminLogin;
    
    // Remove save/cancel buttons
    const btnContainer = document.getElementById('saveCancelBtns');
    if (btnContainer) btnContainer.remove();
}

function savePrayerTimes() {
    const prayers = {};
    const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    
    prayerNames.forEach(prayer => {
        const adhanEl = document.getElementById(prayer + 'Adhan');
        const iqaamaEl = document.getElementById(prayer + 'Iqaama');
        
        if (adhanEl && iqaamaEl) {
            // Validate time format
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            const adhanTime = adhanEl.textContent.trim();
            const iqaamaTime = iqaamaEl.textContent.trim();
            
            if (!timeRegex.test(adhanTime) || !timeRegex.test(iqaamaTime)) {
                alert(`Invalid time format for ${prayer}. Please use HH:MM format (e.g., 05:30)`);
                return;
            }
            
            prayers[prayer] = {
                adhan: adhanTime,
                iqaama: iqaamaTime
            };
        }
    });
    
    // Save to localStorage
    localStorage.setItem('prayerTimes', JSON.stringify(prayers));
    
    // Disable editing
    cancelEditing();
    
    alert('Prayer times saved successfully!');
}

function initializePrayerTimesEditing() {
    // Close modal on overlay click
    const modal = document.getElementById('adminLoginModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAdminLogin();
            }
        });
    }
    
    // Allow Enter key to submit password
    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verifyAdminPassword();
            }
        });
    }
    
    // Prevent accidental editing when not logged in
    const editableElements = document.querySelectorAll('.editable');
    editableElements.forEach(el => {
        el.addEventListener('click', function(e) {
            if (!isAdminLoggedIn) {
                e.preventDefault();
                showAdminLogin();
            }
        });
    });
}

