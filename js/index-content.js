/**
 * Index Content Script
 * 
 * Indexes static page content for search
 */

import { indexContent } from '../services/searchService.js';

/**
 * Index a static HTML page
 * @param {string} pageName - Page name (e.g., 'about', 'programs')
 * @param {string} title - Page title
 * @param {string} content - Page content text
 * @param {string} url - Page URL
 */
async function indexPage(pageName, title, content, url) {
    try {
        await indexContent({
            type: 'page',
            id: pageName,
            title,
            content,
            url,
            metadata: {
                page: pageName
            }
        });
        console.log(`[Index] Indexed page: ${pageName}`);
    } catch (error) {
        console.error(`[Index] Failed to index page ${pageName}:`, error);
    }
}

/**
 * Extract text content from HTML element
 * @param {HTMLElement} element - HTML element
 * @returns {string} Text content
 */
function extractTextContent(element) {
    if (!element) return '';
    
    // Clone to avoid modifying original
    const clone = element.cloneNode(true);
    
    // Remove script and style elements
    const scripts = clone.querySelectorAll('script, style, nav, header, footer');
    scripts.forEach(el => el.remove());
    
    // Get text content
    return clone.textContent || clone.innerText || '';
}

/**
 * Index current page if it's a static content page
 */
async function indexCurrentPage() {
    // Only index if user is authenticated (admin)
    try {
        const { checkSupabaseAuth } = await import('../services/supabaseAuth.js');
        const authStatus = await checkSupabaseAuth();
        
        if (!authStatus.authenticated) {
            return; // Don't index if not authenticated
        }
    } catch (error) {
        console.warn('[Index] Auth check failed, skipping indexing:', error);
        return;
    }
    
    const pageName = document.body.dataset.page || window.location.pathname.split('/').pop().replace('.html', '');
    const title = document.title || document.querySelector('h1')?.textContent || '';
    const mainContent = document.querySelector('main, .main-content, .content');
    const content = extractTextContent(mainContent);
    
    if (title && content) {
        await indexPage(pageName, title, content, window.location.pathname);
    }
}

// Auto-index on admin pages (optional - can be called manually)
// Uncomment to enable auto-indexing
// if (document.body.dataset.autoIndex === 'true') {
//     indexCurrentPage();
// }

export { indexPage, extractTextContent, indexCurrentPage };

