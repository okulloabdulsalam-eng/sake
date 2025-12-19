/**
 * Achievement Unlocking from Journal - Special achievements based on journal patterns
 */

class JournalAchievements {
    constructor() {
        this.achievements = [
            {
                id: 'consistent_journaler',
                name: 'Consistent Journaler',
                description: 'Journal for 30 consecutive days',
                icon: '📝',
                requirement: { type: 'journal_streak', days: 30 },
                xp: 500
            },
            {
                id: 'deep_thinker',
                name: 'Deep Thinker',
                description: 'Generate 100+ insights from journal entries',
                icon: '🧠',
                requirement: { type: 'insights_generated', count: 100 },
                xp: 750
            },
            {
                id: 'goal_setter',
                name: 'Goal Setter',
                description: 'Identify 50+ goals in journal entries',
                icon: '🎯',
                requirement: { type: 'goals_identified', count: 50 },
                xp: 600
            },
            {
                id: 'reflection_master',
                name: 'Reflection Master',
                description: 'Journal 100 entries total',
                icon: '✨',
                requirement: { type: 'total_entries', count: 100 },
                xp: 1000
            },
            {
                id: 'pattern_recognizer',
                name: 'Pattern Recognizer',
                description: 'System identifies 10+ recurring patterns in your entries',
                icon: '🔍',
                requirement: { type: 'patterns_identified', count: 10 },
                xp: 800
            },
            {
                id: 'quest_generator',
                name: 'Quest Generator',
                description: 'Generate 25+ quests from journal entries',
                icon: '⚔️',
                requirement: { type: 'quests_from_journal', count: 25 },
                xp: 900
            },
            {
                id: 'weekly_reflector',
                name: 'Weekly Reflector',
                description: 'Journal every day for a week',
                icon: '📅',
                requirement: { type: 'weekly_streak', days: 7 },
                xp: 300
            },
            {
                id: 'insight_seeker',
                name: 'Insight Seeker',
                description: 'Have 50+ entries analyzed',
                icon: '💡',
                requirement: { type: 'analyzed_entries', count: 50 },
                xp: 650
            }
        ];
    }

    async init() {
        // Check achievements periodically
        setInterval(() => {
            this.checkJournalAchievements();
        }, 5 * 60 * 1000); // Every 5 minutes

        // Check immediately
        await this.checkJournalAchievements();
    }

    async checkJournalAchievements() {
        if (typeof aiJournalSystem === 'undefined' || typeof achievementSystem === 'undefined') {
            return;
        }

        const entries = aiJournalSystem.entries;
        const memory = aiJournalSystem.memory;

        // Check each achievement
        for (const achievement of this.achievements) {
            // Skip if already unlocked
            if (achievementSystem.isAchievementUnlocked(achievement.id)) {
                continue;
            }

            let progress = 0;
            let completed = false;

            switch (achievement.requirement.type) {
                case 'journal_streak':
                    progress = this.calculateJournalStreak(entries);
                    completed = progress >= achievement.requirement.days;
                    break;

                case 'insights_generated':
                    const totalInsights = entries.reduce((sum, e) => sum + (e.insights?.length || 0), 0);
                    progress = totalInsights;
                    completed = progress >= achievement.requirement.count;
                    break;

                case 'goals_identified':
                    const totalGoals = memory.goals?.length || 0;
                    progress = totalGoals;
                    completed = progress >= achievement.requirement.count;
                    break;

                case 'total_entries':
                    progress = entries.length;
                    completed = progress >= achievement.requirement.count;
                    break;

                case 'patterns_identified':
                    const patterns = memory.patterns?.length || 0;
                    progress = patterns;
                    completed = progress >= achievement.requirement.count;
                    break;

                case 'quests_from_journal':
                    // Count quests that were generated from journal entries
                    const journalQuests = await this.countJournalQuests();
                    progress = journalQuests;
                    completed = progress >= achievement.requirement.count;
                    break;

                case 'weekly_streak':
                    progress = this.calculateWeeklyStreak(entries);
                    completed = progress >= achievement.requirement.days;
                    break;

                case 'analyzed_entries':
                    const analyzed = entries.filter(e => e.analyzed).length;
                    progress = analyzed;
                    completed = progress >= achievement.requirement.count;
                    break;
            }

            if (completed) {
                await this.unlockAchievement(achievement);
            }
        }
    }

    calculateJournalStreak(entries) {
        if (entries.length === 0) return 0;

        // Sort by date (newest first)
        const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
        
        let streak = 0;
        let currentDate = new Date().setHours(0, 0, 0, 0);
        
        for (const entry of sorted) {
            const entryDate = new Date(entry.timestamp).setHours(0, 0, 0, 0);
            const daysDiff = (currentDate - entryDate) / (1000 * 60 * 60 * 24);
            
            if (daysDiff === streak) {
                streak++;
                currentDate = entryDate;
            } else if (daysDiff > streak) {
                break; // Streak broken
            }
        }

        return streak;
    }

    calculateWeeklyStreak(entries) {
        const today = new Date().setHours(0, 0, 0, 0);
        const weekAgo = today - (7 * 24 * 60 * 60 * 1000);
        
        const weekEntries = entries.filter(e => {
            const entryDate = new Date(e.timestamp).setHours(0, 0, 0, 0);
            return entryDate >= weekAgo;
        });

        // Count unique days
        const uniqueDays = new Set();
        weekEntries.forEach(e => {
            const day = new Date(e.timestamp).toISOString().split('T')[0];
            uniqueDays.add(day);
        });

        return uniqueDays.size;
    }

    async countJournalQuests() {
        const pendingQuests = await db.getPendingQuests() || [];
        const allQuests = await db.getAllQuests() || [];
        
        // Count quests that have sourceEntryId (generated from journal)
        const journalQuests = [
            ...pendingQuests.filter(pq => pq.sourceEntryId),
            ...allQuests.filter(q => q.sourceEntryId)
        ];

        return journalQuests.length;
    }

    async unlockAchievement(achievement) {
        if (typeof achievementSystem !== 'undefined') {
            // Add to achievement system
            await achievementSystem.unlockAchievement(achievement.id, {
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
                xp: achievement.xp
            });

            showNotification(
                'Achievement Unlocked!',
                `${achievement.icon} ${achievement.name}: ${achievement.description}`,
                'achievement'
            );
        }
    }
}

const journalAchievements = new JournalAchievements();


