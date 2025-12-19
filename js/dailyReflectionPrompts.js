/**
 * Daily Reflection Prompts System - Encourages consistent journaling
 */

class DailyReflectionPrompts {
    constructor() {
        this.prompts = [
            "What was the most significant thing that happened today?",
            "What did you learn today that you didn't know yesterday?",
            "What challenge did you face today, and how did you handle it?",
            "What are you grateful for today?",
            "What goal did you make progress on today?",
            "What interaction with someone else stood out to you today?",
            "What would you do differently if you could relive today?",
            "What skill or knowledge did you practice or apply today?",
            "What made you feel proud or accomplished today?",
            "What's one thing you want to remember about today?",
            "What decision did you make today that will impact your future?",
            "What did you observe about yourself today?",
            "What opportunity presented itself today?",
            "What relationship or connection did you strengthen today?",
            "What obstacle did you overcome today?"
        ];
        this.lastPromptTime = null;
        this.promptInterval = 24 * 60 * 60 * 1000; // 24 hours
    }

    async init() {
        const saved = localStorage.getItem('lastReflectionPrompt');
        if (saved) {
            this.lastPromptTime = parseInt(saved);
        }
        
        this.checkAndShowPrompt();
        
        // Check every hour if it's time to show a prompt
        setInterval(() => {
            this.checkAndShowPrompt();
        }, 60 * 60 * 1000);
    }

    checkAndShowPrompt() {
        const now = Date.now();
        
        // Check if 24 hours have passed since last prompt
        if (!this.lastPromptTime || (now - this.lastPromptTime) >= this.promptInterval) {
            // Check if user has journaled today
            this.checkJournalActivity().then(hasJournaled => {
                if (!hasJournaled) {
                    this.showPrompt();
                }
            });
        }
    }

    async checkJournalActivity() {
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

    getContextualPrompt() {
        // Get a prompt based on user's journal patterns
        if (typeof aiJournalSystem !== 'undefined' && aiJournalSystem.memory) {
            const memory = aiJournalSystem.memory;
            
            // If user frequently discusses challenges
            if (memory.challenges && memory.challenges.length > 5) {
                return "What challenge are you facing right now, and what's one small step you can take to address it?";
            }
            
            // If user has many goals
            if (memory.goals && memory.goals.length > 5) {
                return "Which of your goals did you make progress on today? What's the next step?";
            }
            
            // If user discusses career frequently
            const topCategory = Object.entries(memory.userProfile?.categories || {})
                .sort((a, b) => b[1] - a[1])[0];
            
            if (topCategory && topCategory[0] === 'career') {
                return "What did you accomplish at work today? What skill did you use or develop?";
            }
        }
        
        // Default: random prompt
        return this.prompts[Math.floor(Math.random() * this.prompts.length)];
    }

    showPrompt() {
        const prompt = this.getContextualPrompt();
        
        // Show notification with prompt
        showNotification(
            'Daily Reflection',
            prompt,
            'info',
            10000 // Show for 10 seconds
        );
        
        // Also show in journal area if user is on that page
        const journalInput = document.getElementById('ai-journal-input');
        if (journalInput) {
            journalInput.placeholder = `💭 ${prompt}`;
            
            // Reset placeholder after 30 seconds
            setTimeout(() => {
                if (journalInput.placeholder.includes('💭')) {
                    journalInput.placeholder = "Share your thoughts, experiences, goals, challenges... (Works offline)";
                }
            }, 30000);
        }
        
        this.lastPromptTime = Date.now();
        localStorage.setItem('lastReflectionPrompt', this.lastPromptTime.toString());
    }

    getPrompt() {
        return this.getContextualPrompt();
    }
}

const dailyReflectionPrompts = new DailyReflectionPrompts();


