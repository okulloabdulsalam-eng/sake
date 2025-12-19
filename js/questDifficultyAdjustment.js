/**
 * Quest Difficulty Auto-Adjustment - System learns and adjusts difficulty
 */

class QuestDifficultyAdjustment {
    constructor() {
        this.userPerformance = {
            easy: { completed: 0, failed: 0, avgTime: 0 },
            medium: { completed: 0, failed: 0, avgTime: 0 },
            hard: { completed: 0, failed: 0, avgTime: 0 }
        };
        this.adjustmentFactor = 1.0; // Multiplier for difficulty
    }

    async init() {
        await this.loadPerformanceData();
        await this.analyzePerformance();
    }

    async loadPerformanceData() {
        const allQuests = await db.getAllQuests() || [];
        const completedQuests = allQuests.filter(q => q.status === 'completed' || q.status === 'failed');

        // Reset counters
        this.userPerformance = {
            easy: { completed: 0, failed: 0, avgTime: 0, times: [] },
            medium: { completed: 0, failed: 0, avgTime: 0, times: [] },
            hard: { completed: 0, failed: 0, avgTime: 0, times: [] }
        };

        // Analyze each quest
        completedQuests.forEach(quest => {
            const difficulty = quest.difficulty || 'medium';
            const isCompleted = quest.status === 'completed';
            
            if (isCompleted) {
                this.userPerformance[difficulty].completed++;
            } else {
                this.userPerformance[difficulty].failed++;
            }

            // Track completion time
            if (quest.acceptedAt && quest.completedAt && isCompleted) {
                const hours = (quest.completedAt - quest.acceptedAt) / (1000 * 60 * 60);
                this.userPerformance[difficulty].times.push(hours);
            }
        });

        // Calculate average times
        Object.keys(this.userPerformance).forEach(diff => {
            const times = this.userPerformance[diff].times;
            if (times.length > 0) {
                this.userPerformance[diff].avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            }
        });
    }

    async analyzePerformance() {
        // Calculate success rates
        const easyRate = this.getSuccessRate('easy');
        const mediumRate = this.getSuccessRate('medium');
        const hardRate = this.getSuccessRate('hard');

        // Adjust difficulty factor based on performance
        // If user completes easy quests too quickly (100% success, fast time), increase difficulty
        if (easyRate >= 0.95 && this.userPerformance.easy.avgTime < 2) {
            this.adjustmentFactor = 1.1; // 10% harder
        }
        // If user struggles with medium (low success rate), decrease difficulty
        else if (mediumRate < 0.6) {
            this.adjustmentFactor = 0.9; // 10% easier
        }
        // If user does well with medium, keep or slightly increase
        else if (mediumRate >= 0.8) {
            this.adjustmentFactor = 1.05; // 5% harder
        }
        // If user struggles with hard, decrease significantly
        else if (hardRate < 0.4) {
            this.adjustmentFactor = 0.85; // 15% easier
        }
        // Default: balanced
        else {
            this.adjustmentFactor = 1.0;
        }

        // Save adjustment factor
        localStorage.setItem('questDifficultyAdjustment', this.adjustmentFactor.toString());
    }

    getSuccessRate(difficulty) {
        const perf = this.userPerformance[difficulty];
        const total = perf.completed + perf.failed;
        if (total === 0) return 0.7; // Default 70% if no data
        return perf.completed / total;
    }

    adjustQuestDifficulty(baseDifficulty, questContext = {}) {
        // Get base difficulty values
        const difficultyMap = {
            easy: { xp: 20, statBonus: 1 },
            medium: { xp: 50, statBonus: 2 },
            hard: { xp: 100, statBonus: 3 }
        };

        const base = difficultyMap[baseDifficulty] || difficultyMap.medium;
        
        // Apply adjustment factor
        const adjustedXP = Math.round(base.xp * this.adjustmentFactor);
        const adjustedStatBonus = Math.round(base.statBonus * this.adjustmentFactor);

        // Determine actual difficulty level based on adjusted values
        let actualDifficulty = baseDifficulty;
        if (this.adjustmentFactor > 1.1) {
            // Significantly harder
            if (baseDifficulty === 'easy') actualDifficulty = 'medium';
            else if (baseDifficulty === 'medium') actualDifficulty = 'hard';
        } else if (this.adjustmentFactor < 0.9) {
            // Significantly easier
            if (baseDifficulty === 'hard') actualDifficulty = 'medium';
            else if (baseDifficulty === 'medium') actualDifficulty = 'easy';
        }

        return {
            difficulty: actualDifficulty,
            xp: adjustedXP,
            statBonus: adjustedStatBonus,
            adjustmentFactor: this.adjustmentFactor
        };
    }

    getRecommendedDifficulty() {
        const easyRate = this.getSuccessRate('easy');
        const mediumRate = this.getSuccessRate('medium');
        const hardRate = this.getSuccessRate('hard');

        // Recommend based on success rates
        if (easyRate >= 0.9 && this.userPerformance.easy.completed >= 5) {
            return 'medium'; // User is ready for harder quests
        }
        if (mediumRate >= 0.8 && this.userPerformance.medium.completed >= 5) {
            return 'hard'; // User is ready for hardest quests
        }
        if (mediumRate < 0.5) {
            return 'easy'; // User should stick with easier quests
        }
        
        return 'medium'; // Default
    }

    getPerformanceSummary() {
        return {
            easy: {
                successRate: this.getSuccessRate('easy'),
                avgTime: this.userPerformance.easy.avgTime,
                total: this.userPerformance.easy.completed + this.userPerformance.easy.failed
            },
            medium: {
                successRate: this.getSuccessRate('medium'),
                avgTime: this.userPerformance.medium.avgTime,
                total: this.userPerformance.medium.completed + this.userPerformance.medium.failed
            },
            hard: {
                successRate: this.getSuccessRate('hard'),
                avgTime: this.userPerformance.hard.avgTime,
                total: this.userPerformance.hard.completed + this.userPerformance.hard.failed
            },
            adjustmentFactor: this.adjustmentFactor,
            recommendedDifficulty: this.getRecommendedDifficulty()
        };
    }
}

const questDifficultyAdjustment = new QuestDifficultyAdjustment();


