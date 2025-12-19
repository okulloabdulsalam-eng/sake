/**
 * Visual Progress Charts - XP, stats, quests over time
 */

class ProgressCharts {
    constructor() {
        this.chartData = {
            xp: [],
            stats: {},
            quests: []
        };
    }

    async init() {
        await this.loadChartData();
    }

    async loadChartData() {
        // Load XP history
        const history = await db.getHistory(1000) || [];
        this.chartData.xp = history
            .filter(h => h.type === 'xp_gain' || h.type === 'level_up')
            .map(h => ({
                date: new Date(h.timestamp),
                xp: h.amount || h.xpGained || 0,
                level: h.newLevel || h.level
            }))
            .sort((a, b) => a.date - b.date);

        // Load quest completion history
        this.chartData.quests = history
            .filter(h => h.type === 'quest_completed')
            .map(h => ({
                date: new Date(h.timestamp),
                questId: h.questId,
                category: h.category || 'general'
            }))
            .sort((a, b) => a.date - b.date);

        // Load stat snapshots
        const snapshots = await db.getAll('statSnapshots') || [];
        this.chartData.stats = this.processStatSnapshots(snapshots);
    }

    processStatSnapshots(snapshots) {
        const statsByType = {};
        
        snapshots.forEach(snapshot => {
            Object.keys(snapshot.stats || {}).forEach(statName => {
                if (!statsByType[statName]) {
                    statsByType[statName] = [];
                }
                statsByType[statName].push({
                    date: new Date(snapshot.timestamp),
                    value: snapshot.stats[statName]
                });
            });
        });

        // Sort each stat's data by date
        Object.keys(statsByType).forEach(stat => {
            statsByType[stat].sort((a, b) => a.date - b.date);
        });

        return statsByType;
    }

    renderXPChart(containerId = 'xp-chart-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.chartData.xp.length === 0) {
            container.innerHTML = '<div class="glass-panel" style="padding: 2rem; text-align: center; color: var(--text-secondary);">No XP data available yet.</div>';
            return;
        }

        // Group by day
        const dailyXP = {};
        let cumulativeXP = 0;
        
        this.chartData.xp.forEach(point => {
            const dateKey = point.date.toISOString().split('T')[0];
            if (!dailyXP[dateKey]) {
                dailyXP[dateKey] = { date: dateKey, xp: 0, cumulative: 0 };
            }
            dailyXP[dateKey].xp += point.xp;
            cumulativeXP += point.xp;
            dailyXP[dateKey].cumulative = cumulativeXP;
        });

        const days = Object.values(dailyXP).slice(-30); // Last 30 days
        const maxXP = Math.max(...days.map(d => d.cumulative));

        container.innerHTML = `
            <div class="glass-panel" style="padding: 1.5rem;">
                <h3 style="margin: 0 0 1rem 0; color: var(--text-primary);">XP Progress (Last 30 Days)</h3>
                <div style="position: relative; height: 200px; display: flex; align-items: flex-end; gap: 2px;">
                    ${days.map(day => {
                        const height = (day.cumulative / maxXP) * 100;
                        return `
                            <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 100%; background: linear-gradient(to top, var(--neon-blue), var(--neon-blue-light)); height: ${height}%; border-radius: 4px 4px 0 0; min-height: 2px;" title="${day.date}: ${day.cumulative} XP"></div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">
                    <span>${days[0]?.date || ''}</span>
                    <span>Total: ${cumulativeXP} XP</span>
                    <span>${days[days.length - 1]?.date || ''}</span>
                </div>
            </div>
        `;
    }

    renderQuestChart(containerId = 'quest-chart-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.chartData.quests.length === 0) {
            container.innerHTML = '<div class="glass-panel" style="padding: 2rem; text-align: center; color: var(--text-secondary);">No quest completion data available yet.</div>';
            return;
        }

        // Group by week
        const weeklyQuests = {};
        
        this.chartData.quests.forEach(quest => {
            const week = this.getWeekKey(quest.date);
            if (!weeklyQuests[week]) {
                weeklyQuests[week] = { week, count: 0, categories: {} };
            }
            weeklyQuests[week].count++;
            const cat = quest.category || 'general';
            weeklyQuests[week].categories[cat] = (weeklyQuests[week].categories[cat] || 0) + 1;
        });

        const weeks = Object.values(weeklyQuests).slice(-12); // Last 12 weeks
        const maxCount = Math.max(...weeks.map(w => w.count), 1);

        container.innerHTML = `
            <div class="glass-panel" style="padding: 1.5rem;">
                <h3 style="margin: 0 0 1rem 0; color: var(--text-primary);">Quest Completions (Last 12 Weeks)</h3>
                <div style="position: relative; height: 200px; display: flex; align-items: flex-end; gap: 4px;">
                    ${weeks.map(week => {
                        const height = (week.count / maxCount) * 100;
                        return `
                            <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 100%; background: linear-gradient(to top, var(--accent-orange), var(--accent-purple)); height: ${height}%; border-radius: 4px 4px 0 0; min-height: 2px;" title="${week.week}: ${week.count} quests"></div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">
                    <span>${weeks[0]?.week || ''}</span>
                    <span>Total: ${weeks.reduce((sum, w) => sum + w.count, 0)} quests</span>
                    <span>${weeks[weeks.length - 1]?.week || ''}</span>
                </div>
            </div>
        `;
    }

    renderStatChart(statName, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !this.chartData.stats[statName]) return;

        const statData = this.chartData.stats[statName];
        if (statData.length === 0) {
            container.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-secondary);">No data available.</div>';
            return;
        }

        const maxValue = Math.max(...statData.map(d => d.value));
        const recentData = statData.slice(-30); // Last 30 data points

        container.innerHTML = `
            <div class="glass-panel" style="padding: 1.5rem;">
                <h3 style="margin: 0 0 1rem 0; color: var(--text-primary); text-transform: capitalize;">${statName} Progress</h3>
                <div style="position: relative; height: 150px; display: flex; align-items: flex-end; gap: 2px;">
                    ${recentData.map(point => {
                        const height = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
                        return `
                            <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 100%; background: var(--neon-blue); height: ${height}%; border-radius: 4px 4px 0 0; min-height: 2px;" title="${point.value}"></div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-secondary); text-align: center;">
                    Current: ${recentData[recentData.length - 1]?.value || 0} | Max: ${maxValue}
                </div>
            </div>
        `;
    }

    getWeekKey(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const week = Math.ceil((d.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        return `${year}-W${week}`;
    }
}

const progressCharts = new ProgressCharts();


