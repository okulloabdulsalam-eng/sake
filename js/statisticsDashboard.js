/**
 * Statistics Dashboard - Analytics, charts, and progress tracking
 */

class StatisticsDashboard {
    constructor() {
        this.statsHistory = [];
    }

    async init() {
        await this.loadStatsHistory();
    }

    async loadStatsHistory() {
        try {
            const history = await db.getHistory(1000);
            this.statsHistory = history;
        } catch (error) {
            console.error('Error loading stats history:', error);
            this.statsHistory = [];
        }
    }

    async recordStatSnapshot() {
        const playerData = gameEngine.getPlayerData();
        const snapshot = {
            timestamp: Date.now(),
            level: playerData.level,
            rank: playerData.rank,
            totalXP: playerData.totalXP,
            stats: { ...playerData.stats },
            skillPoints: playerData.skillPoints
        };
        
        this.statsHistory.push(snapshot);
        await db.saveStatSnapshot(snapshot);
    }

    getWeeklyStats() {
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const recent = this.statsHistory.filter(s => s.timestamp >= weekAgo);
        
        if (recent.length === 0) return null;

        const first = recent[0];
        const last = recent[recent.length - 1];
        const playerData = gameEngine.getPlayerData();

        return {
            levelGained: playerData.level - first.level,
            xpGained: playerData.totalXP - first.totalXP,
            rankChange: this.compareRank(first.rank, playerData.rank),
            questsCompleted: this.getQuestsCompletedInPeriod(weekAgo),
            statsIncreased: this.calculateStatsIncrease(first.stats, playerData.stats)
        };
    }

    getMonthlyStats() {
        const monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recent = this.statsHistory.filter(s => s.timestamp >= monthAgo);
        
        if (recent.length === 0) return null;

        const first = recent[0];
        const playerData = gameEngine.getPlayerData();

        return {
            levelGained: playerData.level - first.level,
            xpGained: playerData.totalXP - first.totalXP,
            rankChange: this.compareRank(first.rank, playerData.rank),
            questsCompleted: this.getQuestsCompletedInPeriod(monthAgo),
            statsIncreased: this.calculateStatsIncrease(first.stats, playerData.stats)
        };
    }

    async getQuestsCompletedInPeriod(startTime) {
        const allQuests = await db.getAllQuests();
        return allQuests.filter(q => 
            q.status === 'completed' && 
            q.completedAt && 
            q.completedAt >= startTime
        ).length;
    }

    calculateStatsIncrease(oldStats, newStats) {
        const increases = {};
        Object.keys(newStats).forEach(stat => {
            increases[stat] = newStats[stat] - (oldStats[stat] || 0);
        });
        return increases;
    }

    compareRank(rank1, rank2) {
        const ranks = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
        return ranks.indexOf(rank2) - ranks.indexOf(rank1);
    }

    getXPOverTime(days = 7) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        const relevant = this.statsHistory.filter(s => s.timestamp >= cutoff);
        
        return relevant.map(s => ({
            date: new Date(s.timestamp),
            xp: s.totalXP,
            level: s.level
        }));
    }

    getStatProgressOverTime(statName, days = 7) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        const relevant = this.statsHistory.filter(s => s.timestamp >= cutoff);
        
        return relevant.map(s => ({
            date: new Date(s.timestamp),
            value: s.stats[statName] || 0
        }));
    }

    getTotalQuestsCompleted() {
        return this.statsHistory.filter(h => h.type === 'quest_completed').length;
    }

    getTotalXPGained() {
        const playerData = gameEngine.getPlayerData();
        return playerData.totalXP;
    }

    getAverageQuestRating() {
        // This would need quest completion data
        return 0;
    }

    renderDashboard() {
        const container = document.getElementById('statistics-dashboard');
        if (!container) return;

        const weekly = this.getWeeklyStats();
        const monthly = this.getMonthlyStats();
        const playerData = gameEngine.getPlayerData();
        const streak = typeof streakSystem !== 'undefined' ? streakSystem.getCurrentStreak() : 0;
        const achievements = typeof achievementSystem !== 'undefined' ? achievementSystem.getUnlockedAchievements().length : 0;

        let html = `
            <div class="stats-overview">
                <div class="glass-panel">
                    <h3 class="panel-title">Overview</h3>
                    <div class="stat-row">
                        <span>Total XP:</span>
                        <strong>${this.formatNumber(playerData.totalXP)}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Current Streak:</span>
                        <strong>${streak} days 🔥</strong>
                    </div>
                    <div class="stat-row">
                        <span>Achievements:</span>
                        <strong>${achievements}</strong>
                    </div>
                </div>
        `;

        if (weekly) {
            html += `
                <div class="glass-panel">
                    <h3 class="panel-title">This Week</h3>
                    <div class="stat-row">
                        <span>Levels Gained:</span>
                        <strong>+${weekly.levelGained}</strong>
                    </div>
                    <div class="stat-row">
                        <span>XP Gained:</span>
                        <strong>+${this.formatNumber(weekly.xpGained)}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Quests Completed:</span>
                        <strong>${weekly.questsCompleted}</strong>
                    </div>
                </div>
            `;
        }

        if (monthly) {
            html += `
                <div class="glass-panel">
                    <h3 class="panel-title">This Month</h3>
                    <div class="stat-row">
                        <span>Levels Gained:</span>
                        <strong>+${monthly.levelGained}</strong>
                    </div>
                    <div class="stat-row">
                        <span>XP Gained:</span>
                        <strong>+${this.formatNumber(monthly.xpGained)}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Quests Completed:</span>
                        <strong>${monthly.questsCompleted}</strong>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        container.innerHTML = html;
    }

    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}

const statisticsDashboard = new StatisticsDashboard();


