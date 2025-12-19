/**
 * Journal Search System - Search and filter journal entries
 */

class JournalSearch {
    constructor() {
        this.filters = {
            query: '',
            category: '',
            sentiment: '',
            analyzed: '',
            tags: []
        };
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('journal-search-input');
        const categoryFilter = document.getElementById('journal-filter-category');
        const sentimentFilter = document.getElementById('journal-filter-sentiment');
        const analyzedFilter = document.getElementById('journal-filter-analyzed');
        const clearBtn = document.getElementById('btn-journal-clear-filters');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.query = e.target.value.toLowerCase();
                this.applyFilters();
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.applyFilters();
            });
        }

        if (sentimentFilter) {
            sentimentFilter.addEventListener('change', (e) => {
                this.filters.sentiment = e.target.value;
                this.applyFilters();
            });
        }

        if (analyzedFilter) {
            analyzedFilter.addEventListener('change', (e) => {
                this.filters.analyzed = e.target.value;
                this.applyFilters();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }
    }

    searchEntries(entries, filters) {
        let filtered = [...entries];

        // Text search
        if (filters.query) {
            filtered = filtered.filter(entry => {
                const searchText = [
                    entry.text,
                    ...(entry.tags || []),
                    ...(entry.userTags || []),
                    ...(entry.analysis?.keywords || []),
                    ...(entry.analysis?.categories || [])
                ].join(' ').toLowerCase();
                return searchText.includes(filters.query);
            });
        }

        // Category filter
        if (filters.category) {
            filtered = filtered.filter(entry => {
                return entry.analysis?.categories?.includes(filters.category);
            });
        }

        // Sentiment filter
        if (filters.sentiment) {
            filtered = filtered.filter(entry => {
                return entry.analysis?.sentiment === filters.sentiment;
            });
        }

        // Analyzed filter
        if (filters.analyzed !== '') {
            const isAnalyzed = filters.analyzed === 'true';
            filtered = filtered.filter(entry => entry.analyzed === isAnalyzed);
        }

        // Tags filter
        if (filters.tags && filters.tags.length > 0) {
            filtered = filtered.filter(entry => {
                const entryTags = [...(entry.tags || []), ...(entry.userTags || [])];
                return filters.tags.some(tag => entryTags.includes(tag));
            });
        }

        return filtered;
    }

    applyFilters() {
        if (typeof aiJournalSystem !== 'undefined') {
            const filtered = this.searchEntries(aiJournalSystem.entries, this.filters);
            aiJournalSystem.renderJournalEntries(filtered);
            
            // Update results count
            const countEl = document.getElementById('journal-search-results-count');
            if (countEl) {
                const total = aiJournalSystem.entries.length;
                const showing = filtered.length;
                countEl.textContent = showing === total 
                    ? `Showing all ${total} entries`
                    : `Showing ${showing} of ${total} entries`;
            }
        }
    }

    clearFilters() {
        this.filters = {
            query: '',
            category: '',
            sentiment: '',
            analyzed: '',
            tags: []
        };

        const searchInput = document.getElementById('journal-search-input');
        const categoryFilter = document.getElementById('journal-filter-category');
        const sentimentFilter = document.getElementById('journal-filter-sentiment');
        const analyzedFilter = document.getElementById('journal-filter-analyzed');

        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (sentimentFilter) sentimentFilter.value = '';
        if (analyzedFilter) analyzedFilter.value = '';

        this.applyFilters();
    }
}

const journalSearch = new JournalSearch();


