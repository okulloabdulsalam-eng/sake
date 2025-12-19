/**
 * Achievement System - Badges, milestones, and accomplishments
 */

class AchievementSystem {
    constructor() {
        this.achievements = [];
        this.unlockedAchievements = new Set();
    }

    async init() {
        await this.loadAchievements();
        await this.initializeAchievements();
        await this.checkAchievements();
    }

    initializeAchievements() {
        const achievementTemplates = [
            // Level Achievements
            { id: 'first_steps', name: 'First Steps', description: 'Reach Level 5', icon: '👶', category: 'level', requirement: { type: 'level', value: 5 }, reward: { xp: 50 } },
            { id: 'rising_star', name: 'Rising Star', description: 'Reach Level 10', icon: '⭐', category: 'level', requirement: { type: 'level', value: 10 }, reward: { xp: 100 } },
            { id: 'experienced', name: 'Experienced', description: 'Reach Level 25', icon: '🌟', category: 'level', requirement: { type: 'level', value: 25 }, reward: { xp: 250 } },
            { id: 'veteran', name: 'Veteran', description: 'Reach Level 50', icon: '💫', category: 'level', requirement: { type: 'level', value: 50 }, reward: { xp: 500 } },
            { id: 'master', name: 'Master', description: 'Reach Level 100', icon: '👑', category: 'level', requirement: { type: 'level', value: 100 }, reward: { xp: 1000 } },
            
            // Quest Achievements
            { id: 'quest_starter', name: 'Quest Starter', description: 'Complete 5 quests', icon: '📋', category: 'quest', requirement: { type: 'quests_completed', value: 5 }, reward: { xp: 50 } },
            { id: 'quest_master', name: 'Quest Master', description: 'Complete 25 quests', icon: '📜', category: 'quest', requirement: { type: 'quests_completed', value: 25 }, reward: { xp: 200 } },
            { id: 'quest_legend', name: 'Quest Legend', description: 'Complete 100 quests', icon: '🏆', category: 'quest', requirement: { type: 'quests_completed', value: 100 }, reward: { xp: 1000 } },
            { id: 'perfect_completion', name: 'Perfect Completion', description: 'Get 10 excellent ratings', icon: '💎', category: 'quest', requirement: { type: 'excellent_ratings', value: 10 }, reward: { xp: 300 } },
            
            // Rank Achievements
            { id: 'rank_d', name: 'Rank D Hunter', description: 'Reach Rank D', icon: '🟦', category: 'rank', requirement: { type: 'rank', value: 'D' }, reward: { xp: 100 } },
            { id: 'rank_c', name: 'Rank C Hunter', description: 'Reach Rank C', icon: '🟩', category: 'rank', requirement: { type: 'rank', value: 'C' }, reward: { xp: 200 } },
            { id: 'rank_b', name: 'Rank B Hunter', description: 'Reach Rank B', icon: '🟨', category: 'rank', requirement: { type: 'rank', value: 'B' }, reward: { xp: 400 } },
            { id: 'rank_a', name: 'Rank A Hunter', description: 'Reach Rank A', icon: '🟧', category: 'rank', requirement: { type: 'rank', value: 'A' }, reward: { xp: 800 } },
            { id: 'rank_s', name: 'Rank S Hunter', description: 'Reach Rank S', icon: '🟥', category: 'rank', requirement: { type: 'rank', value: 'S' }, reward: { xp: 1500 } },
            { id: 'rank_ss', name: 'Rank SS Hunter', description: 'Reach Rank SS', icon: '🔴', category: 'rank', requirement: { type: 'rank', value: 'SS' }, reward: { xp: 3000 } },
            { id: 'rank_sss', name: 'Rank SSS Hunter', description: 'Reach Rank SSS', icon: '⚫', category: 'rank', requirement: { type: 'rank', value: 'SSS' }, reward: { xp: 5000 } },
            
            // Skill Achievements
            { id: 'skill_learner', name: 'Skill Learner', description: 'Upgrade 5 skills', icon: '📚', category: 'skill', requirement: { type: 'skills_upgraded', value: 5 }, reward: { xp: 100 } },
            { id: 'skill_master', name: 'Skill Master', description: 'Max out 3 skills', icon: '🎓', category: 'skill', requirement: { type: 'skills_maxed', value: 3 }, reward: { xp: 500 } },
            
            // Knowledge Achievements
            { id: 'knowledge_seeker', name: 'Knowledge Seeker', description: 'Complete 10 knowledge-backed quests', icon: '📖', category: 'knowledge', requirement: { type: 'knowledge_quests', value: 10 }, reward: { xp: 200 } },
            { id: 'scholar', name: 'Scholar', description: 'Complete 50 knowledge-backed quests', icon: '🎓', category: 'knowledge', requirement: { type: 'knowledge_quests', value: 50 }, reward: { xp: 1000 } },
            
            // Streak Achievements
            { id: 'dedicated', name: 'Dedicated', description: 'Maintain a 7-day streak', icon: '🔥', category: 'streak', requirement: { type: 'streak', value: 7 }, reward: { xp: 150 } },
            { id: 'unstoppable', name: 'Unstoppable', description: 'Maintain a 30-day streak', icon: '💪', category: 'streak', requirement: { type: 'streak', value: 30 }, reward: { xp: 1000 } },
            
            // Stat Achievements
            { id: 'balanced', name: 'Balanced', description: 'Reach 50 in all stats', icon: '⚖️', category: 'stat', requirement: { type: 'all_stats', value: 50 }, reward: { xp: 500 } },
            { id: 'powerhouse', name: 'Powerhouse', description: 'Reach 100 in any stat', icon: '💥', category: 'stat', requirement: { type: 'stat_max', value: 100 }, reward: { xp: 300 } }
        ];

        achievementTemplates.forEach(achievement => {
            const existing = this.achievements.find(a => a.id === achievement.id);
            if (!existing) {
                this.achievements.push({
                    ...achievement,
                    unlocked: false,
                    unlockedAt: null
                });
            }
        });
    }

    async loadAchievements() {
        try {
            const saved = await db.getAchievements();
            if (saved && saved.length > 0) {
                this.achievements = saved;
                saved.forEach(a => {
                    if (a.unlocked) {
                        this.unlockedAchievements.add(a.id);
                    }
                });
            }
        } catch (error) {
            console.error('Error loading achievements:', error);
        }
    }

    async saveAchievements() {
        try {
            await db.saveAchievements(this.achievements);
        } catch (error) {
            console.error('Error saving achievements:', error);
        }
    }

    async checkAchievements() {
        const playerData = gameEngine.getPlayerData();
        const completedQuests = await db.getCompletedQuests();
        const excellentRatings = completedQuests.filter(q => 
            q.completionData && q.completionData.quality === 'excellent'
        ).length;
        const knowledgeQuests = completedQuests.filter(q => q.questType === 'knowledge_backed').length;
        const skills = skillSystem.getAllSkills();
        const skillsUpgraded = skills.filter(s => s.level > 0).length;
        const skillsMaxed = skills.filter(s => s.level >= s.maxLevel).length;
        const streak = typeof streakSystem !== 'undefined' ? streakSystem.getCurrentStreak() : 0;
        const stats = playerData.stats;
        const allStats50 = Object.values(stats).every(s => s >= 50);
        const statMax = Math.max(...Object.values(stats));

        for (const achievement of this.achievements) {
            if (achievement.unlocked) continue;

            let unlocked = false;
            const req = achievement.requirement;

            switch (req.type) {
                case 'level':
                    unlocked = playerData.level >= req.value;
                    break;
                case 'quests_completed':
                    unlocked = completedQuests.length >= req.value;
                    break;
                case 'excellent_ratings':
                    unlocked = excellentRatings >= req.value;
                    break;
                case 'rank':
                    unlocked = this.compareRank(playerData.rank, req.value) >= 0;
                    break;
                case 'skills_upgraded':
                    unlocked = skillsUpgraded >= req.value;
                    break;
                case 'skills_maxed':
                    unlocked = skillsMaxed >= req.value;
                    break;
                case 'knowledge_quests':
                    unlocked = knowledgeQuests >= req.value;
                    break;
                case 'streak':
                    unlocked = streak >= req.value;
                    break;
                case 'all_stats':
                    unlocked = allStats50;
                    break;
                case 'stat_max':
                    unlocked = statMax >= req.value;
                    break;
            }

            if (unlocked) {
                await this.unlockAchievement(achievement.id);
            }
        }
    }

    compareRank(rank1, rank2) {
        const ranks = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
        return ranks.indexOf(rank1) - ranks.indexOf(rank2);
    }

    async unlockAchievement(achievementId) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (!achievement || achievement.unlocked) return;

        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        this.unlockedAchievements.add(achievementId);

        // Award rewards
        if (achievement.reward.xp) {
            await gameEngine.addXP(achievement.reward.xp, `achievement:${achievement.name}`);
        }

        // Show notification
        showNotification(
            '🏆 Achievement Unlocked!',
            `${achievement.name}: ${achievement.description}`,
            'achievement',
            6000
        );

        // Play sound
        if (typeof audioSystem !== 'undefined') {
            audioSystem.play('achievement');
        }

        await this.saveAchievements();
        await db.addHistory({
            type: 'achievement_unlocked',
            achievementId: achievement.id,
            achievementName: achievement.name
        });

        return achievement;
    }

    getUnlockedAchievements() {
        return this.achievements.filter(a => a.unlocked);
    }

    getLockedAchievements() {
        return this.achievements.filter(a => !a.unlocked);
    }

    getAchievementsByCategory(category) {
        return this.achievements.filter(a => a.category === category);
    }

    getAchievementProgress(achievementId) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (!achievement || achievement.unlocked) return { progress: 100, current: 0, required: 0 };

        const playerData = gameEngine.getPlayerData();
        const req = achievement.requirement;
        let current = 0;
        let required = req.value;

        switch (req.type) {
            case 'level':
                current = playerData.level;
                break;
            case 'quests_completed':
                const completed = db.getCompletedQuests();
                current = completed ? completed.length : 0;
                break;
            case 'rank':
                const ranks = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
                current = ranks.indexOf(playerData.rank);
                required = ranks.indexOf(req.value);
                break;
            default:
                current = 0;
        }

        return {
            progress: Math.min((current / required) * 100, 100),
            current,
            required
        };
    }
}

const achievementSystem = new AchievementSystem();


