/**
 * Daily and Weekly Challenges System
 */

class DailyChallenges {
    constructor() {
        this.dailyChallenges = [];
        this.weeklyChallenges = [];
        this.lastDailyReset = null;
        this.lastWeeklyReset = null;
    }

    async init() {
        await this.loadChallenges();
        await this.checkAndReset();
        await this.generateChallenges();
    }

    async loadChallenges() {
        try {
            const saved = await db.getChallenges();
            if (saved) {
                this.dailyChallenges = saved.daily || [];
                this.weeklyChallenges = saved.weekly || [];
                this.lastDailyReset = saved.lastDailyReset;
                this.lastWeeklyReset = saved.lastWeeklyReset;
            }
        } catch (error) {
            console.error('Error loading challenges:', error);
        }
    }

    async saveChallenges() {
        try {
            await db.saveChallenges({
                daily: this.dailyChallenges,
                weekly: this.weeklyChallenges,
                lastDailyReset: this.lastDailyReset,
                lastWeeklyReset: this.lastWeeklyReset
            });
        } catch (error) {
            console.error('Error saving challenges:', error);
        }
    }

    async checkAndReset() {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * 24 * 60 * 60 * 1000;

        // Reset daily challenges
        if (!this.lastDailyReset || (now - this.lastDailyReset) >= oneDay) {
            this.dailyChallenges = [];
            this.lastDailyReset = now;
        }

        // Reset weekly challenges
        if (!this.lastWeeklyReset || (now - this.lastWeeklyReset) >= oneWeek) {
            this.weeklyChallenges = [];
            this.lastWeeklyReset = now;
        }

        await this.saveChallenges();
    }

    async generateChallenges() {
        if (this.dailyChallenges.length === 0) {
            this.dailyChallenges = this.generateDailyChallenges();
        }

        if (this.weeklyChallenges.length === 0) {
            this.weeklyChallenges = this.generateWeeklyChallenges();
        }

        await this.saveChallenges();
    }

    generateDailyChallenges() {
        const playerData = gameEngine.getPlayerData();
        const challenges = [
            {
                id: 'daily_complete_quest',
                title: 'Complete a Quest',
                description: 'Complete any quest today',
                type: 'daily',
                reward: { xp: 50 },
                requirement: { type: 'complete_quest', count: 1 },
                progress: 0,
                completed: false
            },
            {
                id: 'daily_gain_xp',
                title: 'Gain XP',
                description: `Gain ${100 + playerData.level * 10} XP today`,
                type: 'daily',
                reward: { xp: 30 },
                requirement: { type: 'gain_xp', amount: 100 + playerData.level * 10 },
                progress: 0,
                completed: false
            },
            {
                id: 'daily_upgrade_skill',
                title: 'Upgrade a Skill',
                description: 'Upgrade any skill today',
                type: 'daily',
                reward: { xp: 40 },
                requirement: { type: 'upgrade_skill', count: 1 },
                progress: 0,
                completed: false
            }
        ];

        return challenges;
    }

    generateWeeklyChallenges() {
        const playerData = gameEngine.getPlayerData();
        const challenges = [
            {
                id: 'weekly_complete_quests',
                title: 'Complete 10 Quests',
                description: 'Complete 10 quests this week',
                type: 'weekly',
                reward: { xp: 200, skillPoints: 1 },
                requirement: { type: 'complete_quest', count: 10 },
                progress: 0,
                completed: false
            },
            {
                id: 'weekly_level_up',
                title: 'Level Up',
                description: 'Level up at least once this week',
                type: 'weekly',
                reward: { xp: 150 },
                requirement: { type: 'level_up', count: 1 },
                progress: 0,
                completed: false
            },
            {
                id: 'weekly_knowledge_quests',
                title: 'Knowledge Seeker',
                description: 'Complete 5 knowledge-backed quests',
                type: 'weekly',
                reward: { xp: 250 },
                requirement: { type: 'knowledge_quests', count: 5 },
                progress: 0,
                completed: false
            }
        ];

        return challenges;
    }

    async checkChallengeProgress() {
        const allChallenges = [...this.dailyChallenges, ...this.weeklyChallenges];
        
        for (const challenge of allChallenges) {
            if (challenge.completed) continue;

            let progress = 0;
            const req = challenge.requirement;

            switch (req.type) {
                case 'complete_quest':
                    const today = new Date().setHours(0, 0, 0, 0);
                    const completedToday = await this.getQuestsCompletedSince(today);
                    progress = completedToday.length;
                    break;
                case 'gain_xp':
                    // Would need to track daily XP
                    progress = 0;
                    break;
                case 'upgrade_skill':
                    // Would need to track daily skill upgrades
                    progress = 0;
                    break;
                case 'knowledge_quests':
                    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                    const knowledgeQuests = await this.getKnowledgeQuestsSince(weekAgo);
                    progress = knowledgeQuests.length;
                    break;
            }

            challenge.progress = progress;

            if (progress >= req.count && !challenge.completed) {
                await this.completeChallenge(challenge.id);
            }
        }

        await this.saveChallenges();
    }

    async completeChallenge(challengeId) {
        const challenge = this.dailyChallenges.find(c => c.id === challengeId) ||
                         this.weeklyChallenges.find(c => c.id === challengeId);
        
        if (!challenge) return;

        challenge.completed = true;

        if (challenge.reward.xp) {
            await gameEngine.addXP(challenge.reward.xp, `challenge:${challenge.title}`);
        }

        if (challenge.reward.skillPoints) {
            const playerData = gameEngine.getPlayerData();
            playerData.skillPoints += challenge.reward.skillPoints;
            await gameEngine.savePlayerData();
        }

        showNotification(
            '🎯 Challenge Completed!',
            `${challenge.title}: ${challenge.description}`,
            'challenge',
            4000
        );

        await this.saveChallenges();
    }

    async getQuestsCompletedSince(timestamp) {
        const allQuests = await db.getAllQuests();
        return allQuests.filter(q => 
            q.status === 'completed' && 
            q.completedAt && 
            q.completedAt >= timestamp
        );
    }

    async getKnowledgeQuestsSince(timestamp) {
        const allQuests = await db.getAllQuests();
        return allQuests.filter(q => 
            q.status === 'completed' && 
            q.questType === 'knowledge_backed' &&
            q.completedAt && 
            q.completedAt >= timestamp
        );
    }

    getDailyChallenges() {
        return this.dailyChallenges;
    }

    getWeeklyChallenges() {
        return this.weeklyChallenges;
    }
}

const dailyChallenges = new DailyChallenges();


