/**
 * Daily Streak System - Track daily activity and reward consistency
 */

class StreakSystem {
    constructor() {
        this.streakData = {
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: null,
            totalDaysActive: 0,
            streakStartDate: null
        };
    }

    async init() {
        await this.loadStreakData();
        await this.updateStreak();
    }

    async loadStreakData() {
        try {
            const saved = await db.getStreakData();
            if (saved) {
                this.streakData = { ...this.streakData, ...saved };
            }
        } catch (error) {
            console.error('Error loading streak data:', error);
        }
    }

    async saveStreakData() {
        try {
            await db.saveStreakData(this.streakData);
        } catch (error) {
            console.error('Error saving streak data:', error);
        }
    }

    async updateStreak() {
        const today = this.getTodayString();
        const lastActivity = this.streakData.lastActivityDate;

        if (!lastActivity) {
            // First time - start streak
            this.streakData.currentStreak = 1;
            this.streakData.lastActivityDate = today;
            this.streakData.streakStartDate = today;
            this.streakData.totalDaysActive = 1;
            await this.saveStreakData();
            return;
        }

        if (lastActivity === today) {
            // Already active today
            return;
        }

        const yesterday = this.getYesterdayString();
        if (lastActivity === yesterday) {
            // Continue streak
            this.streakData.currentStreak++;
            this.streakData.lastActivityDate = today;
            this.streakData.totalDaysActive++;
            
            if (this.streakData.currentStreak > this.streakData.longestStreak) {
                this.streakData.longestStreak = this.streakData.currentStreak;
            }

            // Award daily login reward
            await this.awardDailyReward();
        } else {
            // Streak broken
            if (this.streakData.currentStreak > 0) {
                showNotification(
                    '🔥 Streak Broken',
                    `Your ${this.streakData.currentStreak}-day streak has ended. Start a new one today!`,
                    'info'
                );
            }
            this.streakData.currentStreak = 1;
            this.streakData.lastActivityDate = today;
            this.streakData.streakStartDate = today;
            this.streakData.totalDaysActive++;
            await this.awardDailyReward();
        }

        await this.saveStreakData();
        await this.checkStreakAchievements();
    }

    async awardDailyReward() {
        const streak = this.streakData.currentStreak;
        let xpReward = 10;
        let bonusXP = 0;

        // Streak bonuses
        if (streak >= 7) bonusXP += 20;
        if (streak >= 14) bonusXP += 30;
        if (streak >= 30) bonusXP += 50;
        if (streak >= 60) bonusXP += 100;
        if (streak >= 100) bonusXP += 200;

        const totalXP = xpReward + bonusXP;

        await gameEngine.addXP(totalXP, 'daily_login');

        showNotification(
            `🔥 ${streak}-Day Streak!`,
            `Daily login reward: +${totalXP} XP${bonusXP > 0 ? ` (+${bonusXP} streak bonus)` : ''}`,
            'streak',
            4000
        );

        if (typeof audioSystem !== 'undefined') {
            audioSystem.play('streak');
        }
    }

    async checkStreakAchievements() {
        if (typeof achievementSystem !== 'undefined') {
            await achievementSystem.checkAchievements();
        }
    }

    getCurrentStreak() {
        return this.streakData.currentStreak;
    }

    getLongestStreak() {
        return this.streakData.longestStreak;
    }

    getTotalDaysActive() {
        return this.streakData.totalDaysActive;
    }

    getTodayString() {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    getYesterdayString() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    }

    // Mark activity (called when user completes quest or interacts)
    async markActivity() {
        await this.updateStreak();
    }
}

const streakSystem = new StreakSystem();


