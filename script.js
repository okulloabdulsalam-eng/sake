// Service Worker Registration for Offline Support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered:', reg.scope))
            .catch(err => console.log('Service Worker registration failed:', err));
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
            // User is signed in - fetch their data from Firestore
            try {
                const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    currentUser = { uid: user.uid, email: user.email, ...userDoc.data() };
                } else {
                    currentUser = { uid: user.uid, email: user.email, name: user.displayName || user.email.split('@')[0] };
                }
                localStorage.setItem('userData', JSON.stringify(currentUser));
                updateUserDisplay();
            } catch (error) {
                console.error('Error fetching user data:', error);
                // Fallback to localStorage data
                const storedUser = localStorage.getItem('userData');
                if (storedUser) {
                    currentUser = JSON.parse(storedUser);
                    updateUserDisplay();
                }
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

// Update dates (auto-updates) - Hijri from Aladhan API (Umm al-Qura/Makkah method)
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
    
    // Hijri month names
    const hijriMonths = ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 
                       'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 
                       'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'];
    
    // Fetch Hijri date from Aladhan API - Umm al-Qura method (official Saudi/Makkah calendar)
    const hijriDateEl = document.getElementById('hijriDate');
    if (hijriDateEl) {
        try {
            const dd = String(now.getDate()).padStart(2, '0');
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const yyyy = now.getFullYear();
            
            // Aladhan API - Umm al-Qura University, Makkah (official Saudi calendar)
            // This is the BEST and most authoritative source for Hijri dates
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
                const hijriDay = parseInt(hijri.day);
                const hijriMonth = parseInt(hijri.month.number);
                const hijriYear = parseInt(hijri.year);
                
                // Format: "3 Sha'ban, 1447 AH"
                hijriDateEl.textContent = `${hijriDay} ${hijriMonths[hijriMonth - 1]}, ${hijriYear} AH`;
                
                // Check for white days (13th, 14th, 15th of each month)
                if (hijriDay >= 13 && hijriDay <= 15) {
                    checkAndCreateWhiteDaysNotification(hijriDay, hijriMonth, hijriYear, hijriMonths);
                }
            } else {
                throw new Error('Invalid API response');
            }
        } catch (error) {
            console.log('Hijri API error:', error.message);
            // Fallback: show loading or approximate
            hijriDateEl.textContent = 'Loading Hijri date...';
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
    
    // Find next prayer
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    let nextPrayer = prayerTimes[prayerTimes.length - 1]; // Default to Isha
    let nextPrayerIndex = prayerTimes.length - 1;
    
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
    const nextPrayerTime = document.getElementById('nextPrayerTime');
    if (nextPrayerTime && nextPrayer) {
        nextPrayerTime.textContent = nextPrayer.name + ' (' + nextPrayer.time + ')';
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
    
    if (currentUser) {
        // Change icon to show logged in state
        if (accountIcon) {
            accountIcon.className = 'fas fa-user-circle logged-in';
        }
        if (accountIconBtn) {
            accountIconBtn.classList.add('logged-in');
            accountIconBtn.title = 'Account';
        }
    } else {
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
                        <button class="btn btn-secondary" onclick="handleLogout()" style="width: 100%;">
                            <i class="fas fa-sign-out-alt"></i> Logout
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
        
        // Get additional user data from Firestore
        const userDoc = await firebase.firestore().collection('users').doc(firebaseUser.uid).get();
        
        if (userDoc.exists) {
            currentUser = { uid: firebaseUser.uid, email: firebaseUser.email, ...userDoc.data() };
        } else {
            currentUser = { uid: firebaseUser.uid, email: firebaseUser.email, name: firebaseUser.displayName || email.split('@')[0] };
        }
        
        localStorage.setItem('userData', JSON.stringify(currentUser));
        updateUserDisplay();
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
        // Create user with Firebase Auth
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;
        
        // Update display name
        await firebaseUser.updateProfile({
            displayName: firstName + ' ' + lastName
        });
        
        // Create user document in Firestore
        const userData = {
            firstName: firstName,
            lastName: lastName,
            name: firstName + ' ' + lastName,
            email: email,
            whatsapp: whatsapp,
            gender: gender,
            position: position,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await firebase.firestore().collection('users').doc(firebaseUser.uid).set(userData);
        
        currentUser = { uid: firebaseUser.uid, ...userData };
        localStorage.setItem('userData', JSON.stringify(currentUser));
        updateUserDisplay();
        window.closeAccountModal();
        alert('Account created successfully! Welcome, ' + firstName + '!');
    } catch (error) {
        console.error('Signup error:', error);
        let errorMessage = 'Signup failed. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already registered. Please login instead.';
            window.showLoginTab();
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Please use a stronger password.';
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
    const editForm = document.getElementById('editProfileForm');
    if (editForm && currentUser) {
        // Populate form with current user data
        document.getElementById('editFirstName').value = currentUser.firstName || '';
        document.getElementById('editLastName').value = currentUser.lastName || '';
        document.getElementById('editWhatsApp').value = currentUser.whatsapp || '';
        document.getElementById('editPosition').value = currentUser.position || '';
        editForm.style.display = 'block';
    }
};

window.hideEditProfile = function() {
    const editForm = document.getElementById('editProfileForm');
    if (editForm) {
        editForm.style.display = 'none';
    }
};

window.saveProfileChanges = async function() {
    if (!currentUser) return;
    
    const firstName = document.getElementById('editFirstName').value.trim();
    const lastName = document.getElementById('editLastName').value.trim();
    const whatsapp = document.getElementById('editWhatsApp').value.trim();
    const position = document.getElementById('editPosition').value.trim();
    const saveBtn = document.querySelector('#editProfileForm button[type="button"]');
    
    if (!firstName || !lastName) {
        alert('First name and last name are required.');
        return;
    }
    
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }
    
    try {
        // Update Firestore if user has uid
        if (currentUser.uid) {
            await firebase.firestore().collection('users').doc(currentUser.uid).update({
                firstName: firstName,
                lastName: lastName,
                name: firstName + ' ' + lastName,
                whatsapp: whatsapp,
                position: position,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Update Firebase Auth display name
            const user = firebase.auth().currentUser;
            if (user) {
                await user.updateProfile({ displayName: firstName + ' ' + lastName });
            }
        }
        
        // Update current user
        currentUser.firstName = firstName;
        currentUser.lastName = lastName;
        currentUser.name = firstName + ' ' + lastName;
        currentUser.whatsapp = whatsapp;
        currentUser.position = position;
        
        // Save to localStorage
        localStorage.setItem('userData', JSON.stringify(currentUser));
        
        // Update display
        document.getElementById('accountName').textContent = currentUser.name;
        const positionEl = document.getElementById('accountPosition');
        if (positionEl) {
            positionEl.textContent = position || 'Not specified';
        }
        
        // Hide edit form
        window.hideEditProfile();
        
        // Update user display on page
        updateUserDisplay();
        
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Profile update error:', error);
        alert('Failed to update profile. Please try again.');
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

