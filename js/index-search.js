/**
 * Index Search Integration for index.html
 * 
 * Redirects to search.html when user clicks search bar
 */

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchSection = document.querySelector('.search-section');
    
    if (searchInput && searchSection) {
        // Make search bar clickable
        searchSection.style.cursor = 'pointer';
        
        // Handle click on search bar
        searchSection.addEventListener('click', () => {
            window.location.href = 'search.html';
        });
        
        // Handle Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
                } else {
                    window.location.href = 'search.html';
                }
            }
        });
        
        // Remove readonly on focus to allow typing
        searchInput.addEventListener('focus', () => {
            searchInput.removeAttribute('readonly');
        });
    }
});
