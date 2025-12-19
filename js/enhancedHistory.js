/**
 * Enhanced History System - Search, filter, and detailed history viewing
 */

class EnhancedHistory {
    constructor() {
        this.history = [];
        this.filters = {
            type: null,
            dateRange: null,
            category: null,
            search: null
        };
    }

    async init() {
        await this.loadHistory();
        this.setupHistoryFilters();
    }

    setupHistoryFilters() {
        // Search input
        const searchInput = document.getElementById('history-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value || null;
                this.renderHistory();
            });
        }

        // Type filter
        const typeFilter = document.getElementById('history-filter-type');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.type = e.target.value || null;
                this.renderHistory();
            });
        }

        // Clear filters button
        const clearBtn = document.getElementById('btn-history-clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearFilters();
                if (searchInput) searchInput.value = '';
                if (typeFilter) typeFilter.value = '';
                this.renderHistory();
            });
        }
    }

    async loadHistory() {
        try {
            this.history = await db.getHistory(1000);
            this.history.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        } catch (error) {
            console.error('Error loading history:', error);
            this.history = [];
        }
    }

    filterHistory(filters = {}) {
        this.filters = { ...this.filters, ...filters };
        
        let filtered = [...this.history];

        if (this.filters.type) {
            filtered = filtered.filter(h => h.type === this.filters.type);
        }

        if (this.filters.dateRange) {
            const { start, end } = this.filters.dateRange;
            filtered = filtered.filter(h => {
                const timestamp = h.timestamp || 0;
                return timestamp >= start && timestamp <= end;
            });
        }

        if (this.filters.category) {
            filtered = filtered.filter(h => h.category === this.filters.category);
        }

        if (this.filters.search) {
            const searchLower = this.filters.search.toLowerCase();
            filtered = filtered.filter(h => {
                const searchableText = JSON.stringify(h).toLowerCase();
                return searchableText.includes(searchLower);
            });
        }

        return filtered;
    }

    getHistoryByType(type) {
        return this.history.filter(h => h.type === type);
    }

    getHistoryByDateRange(startDate, endDate) {
        return this.history.filter(h => {
            const timestamp = h.timestamp || 0;
            return timestamp >= startDate && timestamp <= endDate;
        });
    }

    getQuestHistory() {
        return this.history.filter(h => 
            h.type === 'quest_completed' || 
            h.type === 'quest_accepted' ||
            h.type === 'quest_report'
        );
    }

    getXPHistory() {
        return this.history.filter(h => h.type === 'xp_gain');
    }

    getAchievementHistory() {
        return this.history.filter(h => h.type === 'achievement_unlocked');
    }

    renderHistory(filters = {}) {
        const container = document.getElementById('history-container');
        if (!container) return;

        const filtered = this.filterHistory(filters);
        
        if (filtered.length === 0) {
            container.innerHTML = '<p class="empty-state">No history found</p>';
            return;
        }

        let html = '<div class="history-list">';
        
        filtered.forEach(entry => {
            html += this.renderHistoryEntry(entry);
        });

        html += '</div>';
        container.innerHTML = html;
    }

    renderHistoryEntry(entry) {
        const date = new Date(entry.timestamp || Date.now());
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString();

        let icon = '📝';
        let title = entry.type || 'Activity';
        let content = '';

        switch (entry.type) {
            case 'quest_completed':
                icon = '✅';
                title = 'Quest Completed';
                content = entry.questTitle || 'Quest completed';
                break;
            case 'xp_gain':
                icon = '⭐';
                title = 'XP Gained';
                content = `+${entry.amount || 0} XP from ${entry.source || 'unknown'}`;
                break;
            case 'level_up':
                icon = '⬆️';
                title = 'Level Up';
                content = `Reached level ${entry.newLevel || '?'}`;
                break;
            case 'achievement_unlocked':
                icon = '🏆';
                title = 'Achievement Unlocked';
                content = entry.achievementName || 'Achievement';
                break;
            case 'skill_upgrade':
                icon = '📈';
                title = 'Skill Upgraded';
                content = `${entry.skillName || 'Skill'} to level ${entry.newLevel || '?'}`;
                break;
        }

        return `
            <div class="history-entry">
                <div class="history-icon">${icon}</div>
                <div class="history-content">
                    <div class="history-title">${title}</div>
                    <div class="history-details">${content}</div>
                    <div class="history-date">${dateStr} ${timeStr}</div>
                </div>
            </div>
        `;
    }

    clearFilters() {
        this.filters = {
            type: null,
            dateRange: null,
            category: null,
            search: null
        };
    }
}

const enhancedHistory = new EnhancedHistory();

