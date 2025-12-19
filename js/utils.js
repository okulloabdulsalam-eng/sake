/**
 * Utility Functions
 */

// Rank calculation based on total stats
function calculateRank(totalStats) {
    if (totalStats >= 1000) return 'SSS';
    if (totalStats >= 750) return 'SS';
    if (totalStats >= 500) return 'S';
    if (totalStats >= 350) return 'A';
    if (totalStats >= 250) return 'B';
    if (totalStats >= 150) return 'C';
    if (totalStats >= 75) return 'D';
    return 'E';
}

// XP required for next level
function getXPForLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Total XP required to reach a specific level
function getTotalXPForLevel(level) {
    let total = 0;
    for (let i = 1; i < level; i++) {
        total += getXPForLevel(i);
    }
    return total;
}

// Calculate level from total XP
function getLevelFromXP(totalXP) {
    let level = 1;
    let requiredXP = 0;
    
    while (true) {
        const xpForNextLevel = getXPForLevel(level);
        if (requiredXP + xpForNextLevel > totalXP) {
            break;
        }
        requiredXP += xpForNextLevel;
        level++;
    }
    
    return level;
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Generate random ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Get random element from array
function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Shuffle array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Calculate prayer times (simplified offline calculation)
function calculatePrayerTimes(latitude, longitude, timezoneOffset = 0) {
    // Simplified calculation - in production, use a proper library
    const now = new Date();
    const times = {
        fajr: '05:30',
        dhuhr: '12:15',
        asr: '15:45',
        maghrib: '18:30',
        isha: '20:00'
    };
    
    // This is a placeholder - real calculation requires astronomical formulas
    return times;
}

// Check if online
function isOnline() {
    return navigator.onLine;
}

// Sleep function for animations
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Animate number counting
async function animateNumber(element, start, end, duration = 1000) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// Export utility functions
window.utils = {
    calculateRank,
    getXPForLevel,
    getTotalXPForLevel,
    getLevelFromXP,
    formatNumber,
    debounce,
    throttle,
    generateId,
    randomElement,
    shuffleArray,
    calculatePrayerTimes,
    isOnline,
    sleep,
    animateNumber
};





