/**
 * Prayer Times Module Loader
 * 
 * Loads prayer times service and makes it available globally
 */

import { getPrayerTimes, savePrayerTimes } from '../services/prayerTimesService.js';

// Make service available globally for script.js
if (typeof window !== 'undefined') {
    window.prayerTimesService = {
        getPrayerTimes,
        savePrayerTimes
    };
}

console.log('Prayer times service loaded');

