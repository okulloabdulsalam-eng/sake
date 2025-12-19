/**
 * Quest Analytics Dashboard - Domain performance, completion rates, trends
 */

class QuestAnalytics {
    constructor() {
        this.analytics = {
            domainPerformance: {},
            difficultyAnalysis: {},
            completionRates: {},
            timeToCompletion: {},
            categoryStats: {}
        };
    }

    async init() {
        await this.calculateAnalytics();
    }

    async calculateAnalytics() {
        const allQuests = await db.getAllQuests() || [];
        const completedQuests = allQuests.filter(q => q.status === 'completed');
        
        // Domain Performance
        this.analytics.domainPerformance = this.calculateDomainPerformance(completedQuests);
        
        // Difficulty Analysis
        this.analytics.difficultyAnalysis = this.calculateDifficultyAnalysis(completedQuests);
        
        // Completion Rates
        this.analytics.completionRates = this.calculateCompletionRates(allQuests);
        
        // Time to Completion
        this.analytics.timeToCompletion = this.calculateTimeToCompletion(completedQuests);
        
        // Category Stats
        this.analytics.categoryStats = this.calculateCategoryStats(allQuests);
    }

    calculateDomainPerformance(completedQuests) {
        const domainStats = {};
        
        completedQuests.forEach(quest => {
            const domain = quest.knowledgeSource?.domain || quest.category || 'general';
            if (!domainStats[domain]) {
                domainStats[domain] = {
                    total: 0,
                    completed: 0,
                    avgXP: 0,
                    totalXP: 0
                };
            }
            domainStats[domain].total++;
            domainStats[domain].completed++;
            domainStats[domain].totalXP += quest.rewards?.xp || 0;
        });

        Object.keys(domainStats).forEach(domain => {
            domainStats[domain].avgXP = Math.round(domainStats[domain].totalXP / domainStats[domain].completed);
            domainStats[domain].completionRate = 100; // All are completed
        });

        return domainStats;
    }

    calculateDifficultyAnalysis(completedQuests) {
        const difficultyStats = {
            easy: { count: 0, avgXP: 0, totalXP: 0 },
            medium: { count: 0, avgXP: 0, totalXP: 0 },
            hard: { count: 0, avgXP: 0, totalXP: 0 }
        };

        completedQuests.forEach(quest => {
            const difficulty = quest.difficulty || 'medium';
            if (difficultyStats[difficulty]) {
                difficultyStats[difficulty].count++;
                difficultyStats[difficulty].totalXP += quest.rewards?.xp || 0;
            }
        });

        Object.keys(difficultyStats).forEach(diff => {
            if (difficultyStats[diff].count > 0) {
                difficultyStats[diff].avgXP = Math.round(difficultyStats[diff].totalXP / difficultyStats[diff].count);
            }
        });

        return difficultyStats;
    }

    calculateCompletionRates(allQuests) {
        const total = allQuests.length;
        const completed = allQuests.filter(q => q.status === 'completed').length;
        const active = allQuests.filter(q => q.status === 'active').length;
        const failed = allQuests.filter(q => q.status === 'failed').length;

        return {
            total,
            completed,
            active,
            failed,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            successRate: (completed + failed) > 0 ? Math.round((completed / (completed + failed)) * 100) : 0
        };
    }

    calculateTimeToCompletion(completedQuests) {
        if (completedQuests.length === 0) {
            return { avgHours: 0, minHours: 0, maxHours: 0 };
        }

        const times = completedQuests
            .filter(q => q.acceptedAt && q.completedAt)
            .map(q => {
                const hours = (q.completedAt - q.acceptedAt) / (1000 * 60 * 60);
                return hours;
            });

        if (times.length === 0) {
            return { avgHours: 0, minHours: 0, maxHours: 0 };
        }

        return {
            avgHours: Math.round(times.reduce((a, b) => a + b, 0) / times.length * 10) / 10,
            minHours: Math.round(Math.min(...times) * 10) / 10,
            maxHours: Math.round(Math.max(...times) * 10) / 10
        };
    }

    calculateCategoryStats(allQuests) {
        const categoryStats = {};
        
        allQuests.forEach(quest => {
            const category = quest.category || 'general';
            if (!categoryStats[category]) {
                categoryStats[category] = {
                    total: 0,
                    completed: 0,
                    active: 0,
                    failed: 0
                };
            }
            categoryStats[category].total++;
            if (quest.status === 'completed') categoryStats[category].completed++;
            if (quest.status === 'active') categoryStats[category].active++;
            if (quest.status === 'failed') categoryStats[category].failed++;
        });

        Object.keys(categoryStats).forEach(cat => {
            const stats = categoryStats[cat];
            stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        });

        return categoryStats;
    }

    getTopPerformingDomains(limit = 5) {
        const domains = Object.entries(this.analytics.domainPerformance)
            .sort((a, b) => b[1].completed - a[1].completed)
            .slice(0, limit);
        
        return domains.map(([domain, stats]) => ({
            domain,
            ...stats
        }));
    }

    renderDashboard(containerId = 'quest-analytics-dashboard') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const topDomains = this.getTopPerformingDomains(5);
        const completionRates = this.analytics.completionRates;
        const difficultyStats = this.analytics.difficultyAnalysis;
        const timeStats = this.analytics.timeToCompletion;

        container.innerHTML = `
            <div class="glass-panel" style="margin-bottom: 1rem; padding: 1.5rem;">
                <h3 style="margin: 0 0 1rem 0; color: var(--text-primary);">Quest Completion Overview</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; color: var(--neon-blue); font-weight: bold;">${completionRates.completed}</div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">Completed</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; color: var(--accent-orange); font-weight: bold;">${completionRates.active}</div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">Active</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; color: var(--neon-blue-light); font-weight: bold;">${completionRates.completionRate}%</div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">Success Rate</div>
                    </div>
                </div>
            </div>

            <div class="glass-panel" style="margin-bottom: 1rem; padding: 1.5rem;">
                <h3 style="margin: 0 0 1rem 0; color: var(--text-primary);">Top Performing Domains</h3>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${topDomains.map(domain => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-secondary); border-radius: 8px;">
                            <div>
                                <div style="font-weight: 600; color: var(--text-primary); text-transform: capitalize;">${domain.domain}</div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary);">${domain.completed} quests completed</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: var(--neon-blue); font-weight: 600;">${domain.avgXP} XP avg</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="glass-panel" style="margin-bottom: 1rem; padding: 1.5rem;">
                <h3 style="margin: 0 0 1rem 0; color: var(--text-primary);">Difficulty Analysis</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                    ${['easy', 'medium', 'hard'].map(diff => {
                        const stats = difficultyStats[diff] || { count: 0, avgXP: 0 };
                        return `
                            <div style="text-align: center; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                                <div style="text-transform: capitalize; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">${diff}</div>
                                <div style="font-size: 1.5rem; color: var(--neon-blue); font-weight: bold;">${stats.count}</div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary);">${stats.avgXP} XP avg</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="glass-panel" style="padding: 1.5rem;">
                <h3 style="margin: 0 0 1rem 0; color: var(--text-primary);">Completion Time</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; color: var(--neon-blue); font-weight: bold;">${timeStats.avgHours}h</div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">Average</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; color: var(--accent-orange); font-weight: bold;">${timeStats.minHours}h</div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">Fastest</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; color: var(--neon-blue-light); font-weight: bold;">${timeStats.maxHours}h</div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">Longest</div>
                    </div>
                </div>
            </div>
        `;
    }
}

const questAnalytics = new QuestAnalytics();


