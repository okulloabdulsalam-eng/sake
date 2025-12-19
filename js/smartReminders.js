/**
 * Smart Reminders System - Reminds users about pending quests, journaling, challenges
 */

class SmartReminders {
    constructor() {
        this.reminders = [];
        this.checkInterval = 30 * 60 * 1000; // Check every 30 minutes
        this.reminderInterval = null;
    }

    async init() {
        await this.loadReminders();
        this.startReminderSystem();
    }

    async loadReminders() {
        // Load from localStorage or IndexedDB
        const saved = localStorage.getItem('smartReminders');
        if (saved) {
            this.reminders = JSON.parse(saved);
        }
    }

    async saveReminders() {
        localStorage.setItem('smartReminders', JSON.stringify(this.reminders));
    }

    startReminderSystem() {
        // Check immediately
        this.checkAndShowReminders();

        // Then check periodically
        this.reminderInterval = setInterval(() => {
            this.checkAndShowReminders();
        }, this.checkInterval);
    }

    async checkAndShowReminders() {
        // Check for pending quests ready to deliver
        if (typeof pendingQuestDelivery !== 'undefined') {
            const pendingCount = pendingQuestDelivery.getPendingQuestsCount();
            if (pendingCount > 0) {
                const lastReminder = this.getLastReminder('pending_quests');
                const now = Date.now();
                
                // Remind every 2 hours if there are pending quests
                if (!lastReminder || (now - lastReminder) >= 2 * 60 * 60 * 1000) {
                    this.showReminder('pending_quests', `You have ${pendingCount} quest(s) ready to be delivered. Check your quests tab!`);
                    this.setLastReminder('pending_quests', now);
                }
            }
        }

        // Check for journal activity
        if (typeof aiJournalSystem !== 'undefined') {
            const hasJournaledToday = await this.checkJournalToday();
            if (!hasJournaledToday) {
                const lastReminder = this.getLastReminder('journal');
                const now = Date.now();
                const hoursSinceLastEntry = this.getHoursSinceLastJournalEntry();
                
                // Remind if no entry in last 12 hours
                if (hoursSinceLastEntry >= 12) {
                    if (!lastReminder || (now - lastReminder) >= 12 * 60 * 60 * 1000) {
                        this.showReminder('journal', "It's been a while since your last journal entry. Share your thoughts to help the system generate personalized quests!");
                        this.setLastReminder('journal', now);
                    }
                }
            }
        }

        // Check for daily challenges
        if (typeof dailyChallenges !== 'undefined') {
            const challenges = dailyChallenges.getDailyChallenges();
            const incomplete = challenges.filter(c => !c.completed);
            
            if (incomplete.length > 0) {
                const lastReminder = this.getLastReminder('challenges');
                const now = Date.now();
                
                // Remind once per day about challenges
                if (!lastReminder || (now - lastReminder) >= 24 * 60 * 60 * 1000) {
                    this.showReminder('challenges', `You have ${incomplete.length} daily challenge(s) to complete. Check your achievements page!`);
                    this.setLastReminder('challenges', now);
                }
            }
        }
    }

    async checkJournalToday() {
        const today = new Date().setHours(0, 0, 0, 0);
        if (typeof aiJournalSystem !== 'undefined') {
            const todayEntries = aiJournalSystem.entries.filter(entry => {
                const entryDate = new Date(entry.timestamp).setHours(0, 0, 0, 0);
                return entryDate === today;
            });
            return todayEntries.length > 0;
        }
        return false;
    }

    getHoursSinceLastJournalEntry() {
        if (typeof aiJournalSystem !== 'undefined' && aiJournalSystem.entries.length > 0) {
            const lastEntry = aiJournalSystem.entries[0]; // Already sorted by timestamp desc
            const hours = (Date.now() - lastEntry.timestamp) / (1000 * 60 * 60);
            return hours;
        }
        return 999; // Very large number if no entries
    }

    showReminder(type, message) {
        showNotification(
            'Reminder',
            message,
            'info',
            8000 // Show for 8 seconds
        );
    }

    getLastReminder(type) {
        const reminder = this.reminders.find(r => r.type === type);
        return reminder ? reminder.timestamp : null;
    }

    setLastReminder(type, timestamp) {
        const existing = this.reminders.findIndex(r => r.type === type);
        if (existing >= 0) {
            this.reminders[existing].timestamp = timestamp;
        } else {
            this.reminders.push({ type, timestamp });
        }
        this.saveReminders();
    }
}

const smartReminders = new SmartReminders();


