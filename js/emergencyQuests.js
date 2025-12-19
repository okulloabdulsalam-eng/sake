/**
 * Emergency Quests System
 * Time-limited urgent missions (Solo Leveling style)
 */

class EmergencyQuests {
    constructor() {
        this.activeEmergencyQuests = [];
        this.emergencyQuestHistory = [];
    }

    async init() {
        await this.loadEmergencyQuests();
        this.startEmergencyQuestGenerator();
    }

    async loadEmergencyQuests() {
        try {
            const saved = await db.getStat('emergency_quests');
            if (saved) {
                this.activeEmergencyQuests = saved.active || [];
                this.emergencyQuestHistory = saved.history || [];
            }
        } catch (error) {
            console.error('Error loading emergency quests:', error);
            this.activeEmergencyQuests = [];
            this.emergencyQuestHistory = [];
        }
    }

    async saveEmergencyQuests() {
        try {
            await db.saveStat('emergency_quests', {
                active: this.activeEmergencyQuests,
                history: this.emergencyQuestHistory
            });
        } catch (error) {
            console.error('Error saving emergency quests:', error);
        }
    }

    // Generate emergency quest
    async generateEmergencyQuest(context = {}) {
        const emergencyTypes = [
            {
                type: 'urgent_goal',
                title: '[Emergency] Urgent Goal Achievement',
                description: 'A critical goal requires immediate attention. Complete it within the time limit.',
                timeLimit: 2 * 60 * 60 * 1000, // 2 hours
                rewards: {
                    xp: 200,
                    stats: { strategy: 5, intelligence: 3 },
                    skillPoints: 1
                }
            },
            {
                type: 'crisis_management',
                title: '[Emergency] Crisis Management',
                description: 'A crisis situation has been detected. Take immediate action to resolve it.',
                timeLimit: 3 * 60 * 60 * 1000, // 3 hours
                rewards: {
                    xp: 250,
                    stats: { wisdom: 5, strategy: 4 },
                    skillPoints: 1
                }
            },
            {
                type: 'opportunity_seized',
                title: '[Emergency] Time-Sensitive Opportunity',
                description: 'A valuable opportunity has appeared but will expire soon. Act quickly!',
                timeLimit: 1 * 60 * 60 * 1000, // 1 hour
                rewards: {
                    xp: 300,
                    stats: { social: 5, influence: 4 },
                    resources: { influence: 20 }
                }
            },
            {
                type: 'skill_mastery',
                title: '[Emergency] Rapid Skill Development',
                description: 'An opportunity for rapid skill improvement has appeared. Complete intensive training now.',
                timeLimit: 4 * 60 * 60 * 1000, // 4 hours
                rewards: {
                    xp: 180,
                    stats: { intelligence: 4, wisdom: 3 },
                    skillPoints: 2
                }
            }
        ];

        // Randomly select emergency type
        const emergencyType = emergencyTypes[Math.floor(Math.random() * emergencyTypes.length)];

        const emergencyQuest = {
            id: `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...emergencyType,
            status: 'active',
            createdAt: Date.now(),
            expiresAt: Date.now() + emergencyType.timeLimit,
            category: 'emergency',
            difficulty: 'hard',
            mandatory: false
        };

        this.activeEmergencyQuests.push(emergencyQuest);
        await this.saveEmergencyQuests();

        // Add to quest system
        if (typeof questSystem !== 'undefined') {
            questSystem.quests.push(emergencyQuest);
            await db.saveQuest(emergencyQuest);
            questSystem.renderQuests();
        }

        // Show emergency notification
        this.showEmergencyNotification(emergencyQuest);

        return emergencyQuest;
    }

    // Show emergency quest notification
    showEmergencyNotification(quest) {
        const timeRemaining = quest.expiresAt - Date.now();
        const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
        const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));

        const notification = document.createElement('div');
        notification.className = 'emergency-quest-notification notification';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            max-width: 500px;
            z-index: 10001;
            animation: emergencyPulse 0.5s ease;
        `;

        notification.innerHTML = `
            <div class="glass-panel holographic" style="padding: 2rem; border: 3px solid #ef4444; box-shadow: 0 0 30px rgba(239, 68, 68, 0.5);">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <div style="font-size: 4rem; margin-bottom: 0.5rem;">🚨</div>
                    <h2 style="margin: 0 0 0.5rem 0; color: #ef4444; font-size: 1.5rem;">[SYSTEM] EMERGENCY QUEST</h2>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">
                        Time Remaining: ${hours}h ${minutes}m
                    </div>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="margin: 0 0 0.75rem 0; color: var(--text-primary);">${quest.title}</h3>
                    <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5; margin: 0;">
                        ${quest.description}
                    </p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-primary" style="flex: 1;" id="btn-accept-emergency" data-quest-id="${quest.id}">
                        Accept
                    </button>
                    <button class="btn-secondary" style="flex: 1;" onclick="this.closest('.notification').remove()">
                        Dismiss
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Accept button
        notification.querySelector('#btn-accept-emergency').addEventListener('click', () => {
            if (typeof questSystem !== 'undefined') {
                questSystem.acceptQuest(quest.id);
            }
            notification.remove();
        });

        // Auto-dismiss after 30 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 30000);
    }

    // Check for expired emergency quests
    checkExpiredQuests() {
        const now = Date.now();
        const expired = this.activeEmergencyQuests.filter(q => q.expiresAt <= now && q.status === 'active');

        for (const quest of expired) {
            quest.status = 'expired';
            this.emergencyQuestHistory.push({
                ...quest,
                expiredAt: now
            });

            showNotification(
                '[System] Emergency Quest Expired',
                `${quest.title} has expired. The opportunity has been lost.`,
                'warning'
            );
        }

        this.activeEmergencyQuests = this.activeEmergencyQuests.filter(q => q.status === 'active');
        this.saveEmergencyQuests();
    }

    // Start emergency quest generator
    startEmergencyQuestGenerator() {
        // Check for expired quests every minute
        setInterval(() => {
            this.checkExpiredQuests();
        }, 60 * 1000);

        // Generate emergency quests randomly (1-3% chance per hour)
        setInterval(() => {
            if (Math.random() < 0.02) { // 2% chance
                this.generateEmergencyQuest();
            }
        }, 60 * 60 * 1000); // Every hour
    }
}

const emergencyQuests = new EmergencyQuests();

