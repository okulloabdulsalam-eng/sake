// Site-wide search functionality for KIUMA

class SiteSearch {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.searchClear = document.getElementById('searchClear');
        this.searchContainer = document.getElementById('searchContainer');
        this.searchResults = document.getElementById('searchResults');
        this.searchLoading = document.getElementById('searchLoading');
        this.searchEmptyState = document.getElementById('searchEmptyState');
        this.searchPagination = document.getElementById('searchPagination');
        
        this.currentPage = 1;
        this.resultsPerPage = 10;
        this.currentResults = [];
        this.debounceTimer = null;
        
        this.init();
    }
    
    init() {
        if (!this.searchInput) return;
        
        // Listen for input changes with debounce
        this.searchInput.addEventListener('input', (e) => {
            this.handleInput(e.target.value);
        });
        
        // Clear button
        if (this.searchClear) {
            this.searchClear.addEventListener('click', () => {
                this.clearSearch();
            });
        }
        
        // Handle Enter key
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(this.debounceTimer);
                this.performSearch(this.searchInput.value);
            }
        });
        
        // Check for URL query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        if (query) {
            this.searchInput.value = query;
            this.performSearch(query);
        }
    }
    
    handleInput(query) {
        // Show/hide clear button
        if (this.searchClear) {
            this.searchClear.style.display = query.length > 0 ? 'block' : 'none';
        }
        
        // Debounce search
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }
    
    performSearch(query) {
        query = query.trim().toLowerCase();
        
        if (query.length === 0) {
            this.showEmptyState();
            return;
        }
        
        if (query.length < 2) {
            return; // Minimum 2 characters
        }
        
        this.showLoading();
        
        // Simulate slight delay for UX
        setTimeout(() => {
            const results = this.search(query);
            this.currentResults = results;
            this.currentPage = 1;
            this.displayResults(results);
        }, 200);
    }
    
    search(query) {
        if (typeof SEARCH_DATA === 'undefined') {
            console.error('SEARCH_DATA not loaded');
            return [];
        }
        
        const queryWords = query.split(/\s+/).filter(w => w.length > 0);
        const results = [];
        
        SEARCH_DATA.forEach(item => {
            let score = 0;
            const titleLower = item.title.toLowerCase();
            const descLower = item.description.toLowerCase();
            const keywordsStr = item.keywords.join(' ').toLowerCase();
            
            queryWords.forEach(word => {
                // Exact title match (highest score)
                if (titleLower === word) {
                    score += 100;
                }
                // Title contains word
                else if (titleLower.includes(word)) {
                    score += 50;
                }
                
                // Keyword exact match
                if (item.keywords.some(k => k.toLowerCase() === word)) {
                    score += 40;
                }
                // Keyword contains word
                else if (keywordsStr.includes(word)) {
                    score += 20;
                }
                
                // Description contains word
                if (descLower.includes(word)) {
                    score += 10;
                }
            });
            
            if (score > 0) {
                results.push({
                    ...item,
                    score: score
                });
            }
        });
        
        // Sort by score descending
        results.sort((a, b) => b.score - a.score);
        
        return results;
    }
    
    displayResults(results) {
        this.hideLoading();
        
        if (results.length === 0) {
            this.showNoResults();
            return;
        }
        
        if (this.searchEmptyState) {
            this.searchEmptyState.style.display = 'none';
        }
        if (this.searchContainer) {
            this.searchContainer.style.display = 'block';
        }
        
        // Pagination
        const startIndex = (this.currentPage - 1) * this.resultsPerPage;
        const endIndex = startIndex + this.resultsPerPage;
        const pageResults = results.slice(startIndex, endIndex);
        
        // Build results HTML
        let html = `
            <div class="search-results-header">
                <span class="results-count">${results.length} result${results.length !== 1 ? 's' : ''} found</span>
            </div>
            <div class="search-results-list">
        `;
        
        pageResults.forEach(item => {
            const categoryColor = CATEGORY_COLORS[item.category] || '#4CAF50';
            const categoryLabel = CATEGORY_LABELS[item.category] || 'Page';
            
            html += `
                <a href="${item.url}" class="search-result-item">
                    <div class="result-icon" style="background: ${categoryColor};">
                        <i class="fas ${item.icon}"></i>
                    </div>
                    <div class="result-content">
                        <h3 class="result-title">${this.highlightMatch(item.title, this.searchInput.value)}</h3>
                        <p class="result-description">${this.highlightMatch(item.description, this.searchInput.value)}</p>
                        <span class="result-category" style="background: ${categoryColor}20; color: ${categoryColor};">${categoryLabel}</span>
                    </div>
                    <div class="result-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </a>
            `;
        });
        
        html += '</div>';
        
        if (this.searchResults) {
            this.searchResults.innerHTML = html;
        }
        
        // Show pagination if needed
        this.renderPagination(results.length);
    }
    
    highlightMatch(text, query) {
        if (!query || query.trim().length === 0) return text;
        
        const words = query.trim().split(/\s+/).filter(w => w.length > 0);
        let result = text;
        
        words.forEach(word => {
            const regex = new RegExp(`(${this.escapeRegex(word)})`, 'gi');
            result = result.replace(regex, '<mark>$1</mark>');
        });
        
        return result;
    }
    
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    renderPagination(totalResults) {
        if (!this.searchPagination) return;
        
        const totalPages = Math.ceil(totalResults / this.resultsPerPage);
        
        if (totalPages <= 1) {
            this.searchPagination.innerHTML = '';
            return;
        }
        
        let html = '<div class="pagination">';
        
        // Previous button
        if (this.currentPage > 1) {
            html += `<button class="pagination-btn" onclick="siteSearch.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>`;
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                html += `<span class="pagination-btn active">${i}</span>`;
            } else if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                html += `<button class="pagination-btn" onclick="siteSearch.goToPage(${i})">${i}</button>`;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                html += '<span class="pagination-dots">...</span>';
            }
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            html += `<button class="pagination-btn" onclick="siteSearch.goToPage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>`;
        }
        
        html += '</div>';
        this.searchPagination.innerHTML = html;
    }
    
    goToPage(page) {
        this.currentPage = page;
        this.displayResults(this.currentResults);
        
        // Scroll to top of results
        if (this.searchResults) {
            this.searchResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    showLoading() {
        if (this.searchLoading) {
            this.searchLoading.style.display = 'flex';
        }
        if (this.searchResults) {
            this.searchResults.innerHTML = '';
        }
        if (this.searchPagination) {
            this.searchPagination.innerHTML = '';
        }
        if (this.searchContainer) {
            this.searchContainer.style.display = 'block';
        }
        if (this.searchEmptyState) {
            this.searchEmptyState.style.display = 'none';
        }
    }
    
    hideLoading() {
        if (this.searchLoading) {
            this.searchLoading.style.display = 'none';
        }
    }
    
    showEmptyState() {
        if (this.searchContainer) {
            this.searchContainer.style.display = 'none';
        }
        if (this.searchEmptyState) {
            this.searchEmptyState.style.display = 'block';
        }
        if (this.searchClear) {
            this.searchClear.style.display = 'none';
        }
    }
    
    showNoResults() {
        if (this.searchEmptyState) {
            this.searchEmptyState.style.display = 'none';
        }
        if (this.searchContainer) {
            this.searchContainer.style.display = 'block';
        }
        if (this.searchResults) {
            this.searchResults.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No results found</h3>
                    <p>Try different keywords or check your spelling</p>
                </div>
            `;
        }
        if (this.searchPagination) {
            this.searchPagination.innerHTML = '';
        }
    }
    
    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
            this.searchInput.focus();
        }
        this.showEmptyState();
        this.currentResults = [];
        this.currentPage = 1;
    }
}

// Initialize search when DOM is ready
let siteSearch;
document.addEventListener('DOMContentLoaded', () => {
    siteSearch = new SiteSearch();
});
