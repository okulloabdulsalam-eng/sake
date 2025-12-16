/**
 * Book Indexing Script
 * 
 * Indexes all books from the books table
 * Run this manually or on admin action
 */

import { indexAllBooks } from '../services/searchService.js';

/**
 * Index all books (admin function)
 */
async function indexBooks() {
    try {
        console.log('[Index] Starting book indexing...');
        const result = await indexAllBooks();
        console.log(`[Index] ✅ Indexed ${result.indexed} books`);
        alert(`Successfully indexed ${result.indexed} books`);
        return result;
    } catch (error) {
        console.error('[Index] Error indexing books:', error);
        alert('Error indexing books: ' + error.message);
        throw error;
    }
}

// Make available globally for admin use
if (typeof window !== 'undefined') {
    window.indexBooks = indexBooks;
}

export { indexBooks };

