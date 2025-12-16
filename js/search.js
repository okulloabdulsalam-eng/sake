/**
 * Frontend Search Component
 * 
 * Handles search input, debouncing, and result display
 */

import { search } from '../services/searchService.js';

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Highlight search terms in text
function highlightText(text, query) {
    if (!query || !text) return text;
    
    const terms = query.trim().split(/\s+/).filter(term => term.length > 0);
    if (terms.length === 0) return text;
    
    let highlighted = text;
    terms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi');
        highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });
    
    return highlighted;
}

// Format search result snippet
function getSnippet(content, query, maxLength = 200) {
    if (!content) return '';
    
    const terms = query.trim().split(/\s+/).filter(term => term.length > 0);
    if (terms.length === 0) {
        return content.length > maxLength 
            ? content.substring(0, maxLength) + '...' 
            : content;
    }
    
    // Find first occurrence of any search term
    let index = -1;
    for (const term of terms) {
        const termIndex = content.toLowerCase().indexOf(term.toLowerCase());
        if (termIndex !== -1 && (index === -1 || termIndex < index)) {
            index = termIndex;
        }
    }
    
    if (index === -1) {
        return content.length > maxLength 
            ? content.substring(0, maxLength) + '...' 
            : content;
    }
    
    // Extract snippet around the match
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + maxLength);
    let snippet = content.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet;
}

// Render search results
function renderResults(results, query, container) {
    if (!container) return;
    
    if (!results || results.length === 0) {
        container.innerHTML = `
            <div class="search-no-results">
                <i class="fas fa-search"></i>
                <p>No results found for "<strong>${escapeHtml(query)}</strong>"</p>
                <p class="search-suggestion">Try different keywords or check your spelling</p>
            </div>
        `;
        return;
    }
    
    const resultsHtml = results.map(result => {
        const snippet = getSnippet(result.content, query);
        const highlightedTitle = highlightText(result.title, query);
        const highlightedSnippet = highlightText(snippet, query);
        
        const typeIcon = getTypeIcon(result.type);
        const typeLabel = getTypeLabel(result.type);
        
        return `
            <div class="search-result-item" data-type="${result.type}" data-id="${result.contentId}">
                <div class="search-result-header">
                    <i class="${typeIcon}"></i>
                    <span class="search-result-type">${typeLabel}</span>
                </div>
                <h3 class="search-result-title">
                    <a href="${result.url || '#'}" onclick="handleSearchResultClick(event, '${result.type}', '${result.contentId}')">
                        ${highlightedTitle}
                    </a>
                </h3>
                ${snippet ? `<p class="search-result-snippet">${highlightedSnippet}</p>` : ''}
                ${result.metadata?.author ? `<p class="search-result-meta">Author: ${escapeHtml(result.metadata.author)}</p>` : ''}
            </div>
        `;
    }).join('');
    
    container.innerHTML = resultsHtml;
}

// Get icon for content type
function getTypeIcon(type) {
    const icons = {
        'book': 'fas fa-book',
        'page': 'fas fa-file-alt',
        'event': 'fas fa-calendar-alt',
        'activity': 'fas fa-running',
        'notification': 'fas fa-bell',
        'program': 'fas fa-book-open'
    };
    return icons[type] || 'fas fa-file';
}

// Get label for content type
function getTypeLabel(type) {
    const labels = {
        'book': 'Book',
        'page': 'Page',
        'event': 'Event',
        'activity': 'Activity',
        'notification': 'Notification',
        'program': 'Program'
    };
    return labels[type] || 'Content';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle search result click
function handleSearchResultClick(event, type, id) {
    // Allow default navigation
    // Could add analytics tracking here
    console.log('[Search] Result clicked:', type, id);
}

// Initialize search functionality
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchContainer = document.getElementById('searchContainer');
    const searchLoading = document.getElementById('searchLoading');
    const searchPagination = document.getElementById('searchPagination');
    
    if (!searchInput) return;
    
    let currentPage = 1;
    let currentQuery = '';
    let isLoading = false;
    
    // Debounced search function
    const performSearch = debounce(async (query, page = 1) => {
        if (isLoading) return;
        
        if (!query || query.trim().length < 2) {
            if (searchResults) searchResults.innerHTML = '';
            if (searchPagination) searchPagination.innerHTML = '';
            if (searchContainer) searchContainer.style.display = 'none';
            return;
        }
        
        isLoading = true;
        currentQuery = query;
        currentPage = page;
        
        // Show loading state
        if (searchLoading) searchLoading.style.display = 'block';
        if (searchResults) searchResults.innerHTML = '';
        if (searchContainer) searchContainer.style.display = 'block';
        
        try {
            const results = await search(query.trim(), {
                page,
                limit: 10
            });
            
            // Hide loading
            if (searchLoading) searchLoading.style.display = 'none';
            
            // Render results
            if (searchResults) {
                renderResults(results.results, query, searchResults);
            }
            
            // Render pagination
            if (searchPagination && results.totalPages > 1) {
                renderPagination(results, query, searchPagination);
            } else if (searchPagination) {
                searchPagination.innerHTML = '';
            }
            
        } catch (error) {
            console.error('[Search] Error:', error);
            if (searchLoading) searchLoading.style.display = 'none';
            if (searchResults) {
                searchResults.innerHTML = `
                    <div class="search-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error performing search. Please try again.</p>
                    </div>
                `;
            }
        } finally {
            isLoading = false;
        }
    }, 300); // 300ms debounce
    
    // Handle input
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        performSearch(query, 1);
    });
    
    // Handle Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value;
            if (query.trim().length >= 2) {
                performSearch(query, 1);
            }
        }
    });
    
    // Handle clear button
    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            if (searchResults) searchResults.innerHTML = '';
            if (searchPagination) searchPagination.innerHTML = '';
            if (searchContainer) searchContainer.style.display = 'none';
        });
    }
    
    // Expose pagination handler
    window.handleSearchPage = (page) => {
        if (currentQuery) {
            performSearch(currentQuery, page);
            // Scroll to top of results
            if (searchContainer) {
                searchContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };
}

// Render pagination
function renderPagination(results, query, container) {
    const { page, totalPages } = results;
    
    let paginationHtml = '<div class="search-pagination">';
    
    // Previous button
    if (page > 1) {
        paginationHtml += `<button class="search-page-btn" onclick="handleSearchPage(${page - 1})">
            <i class="fas fa-chevron-left"></i> Previous
        </button>`;
    }
    
    // Page numbers
    const maxPages = 5;
    let startPage = Math.max(1, page - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    if (startPage > 1) {
        paginationHtml += `<button class="search-page-btn" onclick="handleSearchPage(1)">1</button>`;
        if (startPage > 2) {
            paginationHtml += '<span class="search-page-ellipsis">...</span>';
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `<button class="search-page-btn ${i === page ? 'active' : ''}" 
            onclick="handleSearchPage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHtml += '<span class="search-page-ellipsis">...</span>';
        }
        paginationHtml += `<button class="search-page-btn" onclick="handleSearchPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    if (page < totalPages) {
        paginationHtml += `<button class="search-page-btn" onclick="handleSearchPage(${page + 1})">
            Next <i class="fas fa-chevron-right"></i>
        </button>`;
    }
    
    paginationHtml += '</div>';
    
    // Results count
    paginationHtml += `<div class="search-results-count">
        Showing ${(page - 1) * results.limit + 1}-${Math.min(page * results.limit, results.total)} of ${results.total} results
    </div>`;
    
    container.innerHTML = paginationHtml;
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
} else {
    initSearch();
}

// Export for use in other modules
export { initSearch, highlightText, getSnippet };

