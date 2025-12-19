/**
 * Notification System - Floating overlay notifications
 */

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.container = null;
    }

    // Initialize notification system
    init() {
        this.container = document.getElementById('notification-overlay');
        if (!this.container) {
            console.error('Notification overlay container not found');
        }
    }

    // Show notification
    show(title, content, type = 'info', duration = 5000) {
        if (!this.container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-content">${content}</div>
        `;

        this.container.appendChild(notification);

        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'notificationSlideOut 0.5s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 500);
            }
        }, duration);

        // Click to dismiss
        notification.addEventListener('click', () => {
            notification.style.animation = 'notificationSlideOut 0.5s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        });

        return notification;
    }

    // Show XP gain notification with animation
    showXPGain(amount) {
        return this.show(
            `+${amount} XP`,
            `Experience gained!`,
            'xp-gain',
            3000
        );
    }

    // Show level up notification
    showLevelUp(level, skillPoints) {
        return this.show(
            'LEVEL UP!',
            `You reached level ${level}! Gained ${skillPoints} skill points!`,
            'level-up',
            6000
        );
    }

    // Show quest notification
    showQuest(questTitle, type = 'quest-accept') {
        const messages = {
            'quest-accept': `Quest "${questTitle}" accepted!`,
            'quest-complete': `Quest "${questTitle}" completed!`,
            'quest-assign': `New quest assigned: "${questTitle}"`
        };
        
        return this.show(
            type === 'quest-complete' ? 'Quest Completed!' : 'Quest Assigned',
            messages[type] || messages['quest-assign'],
            type,
            4000
        );
    }

    // Show skill upgrade notification
    showSkillUpgrade(skillName, level) {
        return this.show(
            'Skill Upgraded!',
            `${skillName} upgraded to level ${level}!`,
            'skill-upgrade',
            3000
        );
    }

    // Show rank change notification
    showRankChange(oldRank, newRank) {
        return this.show(
            'RANK UP!',
            `Congratulations! Your rank increased from ${oldRank} to ${newRank}!`,
            'rank-up',
            6000
        );
    }
}

// Global notification function with [System] prefix standardization
function showNotification(title, content, type = 'info', duration = 5000) {
    // Add [System] prefix if not already present (Solo Leveling style)
    let formattedTitle = title;
    if (!title.startsWith('[System]') && !title.startsWith('[')) {
        formattedTitle = `[System] ${title}`;
    }
    
    if (window.notificationSystem) {
        return window.notificationSystem.show(formattedTitle, content, type, duration);
    }
    console.log(`[${type.toUpperCase()}] ${formattedTitle}: ${content}`);
}

// Export singleton instance
const notificationSystem = new NotificationSystem();
window.notificationSystem = notificationSystem;




