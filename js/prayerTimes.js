/**
 * Prayer Times Calculator - Offline calculation using simplified methods
 */

class PrayerTimes {
    constructor() {
        this.latitude = null;
        this.longitude = null;
        this.timezone = null;
    }

    // Initialize with user location (optional)
    async init() {
        // Try to get location from localStorage
        const savedLocation = localStorage.getItem('prayerLocation');
        if (savedLocation) {
            const location = JSON.parse(savedLocation);
            this.latitude = location.lat;
            this.longitude = location.lng;
            this.timezone = location.timezone || this.getTimezoneOffset();
        } else {
            // Default location (can be changed by user)
            this.latitude = 0;
            this.longitude = 0;
            this.timezone = this.getTimezoneOffset();
        }
    }

    // Get timezone offset in hours
    getTimezoneOffset() {
        return -new Date().getTimezoneOffset() / 60;
    }

    // Calculate prayer times for today (simplified calculation)
    calculatePrayerTimes(date = new Date()) {
        // Simplified calculation - for production, use a proper library like adhan.js
        // This is a placeholder that provides approximate times
        
        const hours = date.getHours();
        const minutes = date.getMinutes();
        
        // Basic calculation based on sun position (very simplified)
        // Real calculation requires proper astronomical formulas
        const times = {
            fajr: this.calculateTime(5, 30, date),
            dhuhr: this.calculateTime(12, 15, date),
            asr: this.calculateTime(15, 45, date),
            maghrib: this.calculateTime(18, 30, date),
            isha: this.calculateTime(20, 0, date)
        };
        
        return times;
    }

    // Calculate a specific time
    calculateTime(hour, minute, date) {
        const time = new Date(date);
        time.setHours(hour, minute, 0, 0);
        return time;
    }

    // Format time for display
    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }

    // Get next prayer time
    getNextPrayer() {
        const now = new Date();
        const times = this.calculatePrayerTimes(now);
        
        const prayers = [
            { name: 'Fajr', time: times.fajr },
            { name: 'Dhuhr', time: times.dhuhr },
            { name: 'Asr', time: times.asr },
            { name: 'Maghrib', time: times.maghrib },
            { name: 'Isha', time: times.isha }
        ];
        
        // Find next prayer
        for (const prayer of prayers) {
            if (prayer.time > now) {
                return prayer;
            }
        }
        
        // If all prayers passed, return tomorrow's Fajr
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowTimes = this.calculatePrayerTimes(tomorrow);
        return { name: 'Fajr', time: tomorrowTimes.fajr };
    }

    // Render prayer times
    renderPrayerTimes() {
        const container = document.getElementById('prayer-times-list');
        if (!container) return;

        const times = this.calculatePrayerTimes();
        
        const prayers = [
            { name: 'Fajr', time: times.fajr },
            { name: 'Dhuhr', time: times.dhuhr },
            { name: 'Asr', time: times.asr },
            { name: 'Maghrib', time: times.maghrib },
            { name: 'Isha', time: times.isha }
        ];

        const nextPrayer = this.getNextPrayer();

        let html = '';
        prayers.forEach(prayer => {
            const isNext = prayer.name === nextPrayer.name;
            html += `
                <div class="prayer-time-item ${isNext ? 'next-prayer' : ''}" style="${isNext ? 'border: 1px solid #00d4ff; box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);' : ''}">
                    <span class="prayer-name">${prayer.name}${isNext ? ' (Next)' : ''}</span>
                    <span class="prayer-time">${this.formatTime(prayer.time)}</span>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Set location
    setLocation(lat, lng, timezone = null) {
        this.latitude = lat;
        this.longitude = lng;
        this.timezone = timezone || this.getTimezoneOffset();
        
        localStorage.setItem('prayerLocation', JSON.stringify({
            lat, lng, timezone: this.timezone
        }));
    }

    // Request location (optional feature)
    async requestLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.setLocation(
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    resolve(position);
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }
}

// Export singleton instance
const prayerTimes = new PrayerTimes();





