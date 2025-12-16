/**
 * Library Service
 * 
 * Handles all library/book operations with Supabase
 */

import { getSupabaseClient } from './supabaseClient.js';
import { LibraryItem } from '../models/LibraryItem.js';
import { handleError } from '../utils/errorHandler.js';
import { log } from '../utils/logger.js';

/**
 * Fetch all books from Supabase
 * @param {string} category - Filter by category (optional)
 * @param {number} limit - Limit results (optional)
 * @param {number} offset - Offset for pagination (optional)
 * @returns {Promise<Array<LibraryItem>>}
 */
async function fetchBooks(category = 'all', limit = null, offset = 0) {
    try {
        const supabase = getSupabaseClient();
        let query = supabase
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });

        // Filter by category if not 'all'
        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        // Apply limit if provided
        if (limit) {
            query = query.limit(limit).range(offset, offset + limit - 1);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        // Convert to LibraryItem objects
        return data.map(record => LibraryItem.fromRecord(record));
    } catch (error) {
        log('error', 'Failed to fetch books', error);
        throw handleError(error, 'Failed to load books');
    }
}

/**
 * Search books by title or author
 * @param {string} searchTerm - Search term
 * @param {string} category - Filter by category (optional)
 * @returns {Promise<Array<LibraryItem>>}
 */
async function searchBooks(searchTerm, category = 'all') {
    try {
        const supabase = getSupabaseClient();
        let query = supabase
            .from('books')
            .select('*')
            .or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%`)
            .order('created_at', { ascending: false });

        // Filter by category if not 'all'
        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return data.map(record => LibraryItem.fromRecord(record));
    } catch (error) {
        log('error', 'Failed to search books', error);
        throw handleError(error, 'Failed to search books');
    }
}

/**
 * Get a single book by ID
 * @param {string|number} id - Book ID
 * @returns {Promise<LibraryItem|null>}
 */
async function getBookById(id) {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found
                return null;
            }
            throw error;
        }

        return data ? LibraryItem.fromRecord(data) : null;
    } catch (error) {
        log('error', 'Failed to get book', error);
        throw handleError(error, 'Failed to load book');
    }
}

/**
 * Add a new book
 * @param {LibraryItem} book - Book item to add
 * @returns {Promise<LibraryItem>}
 */
async function addBook(book) {
    try {
        // Validate book
        const validation = book.validate();
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        const supabase = getSupabaseClient();
        const bookData = book.toJSON();
        
        // Remove id if it's null (let database generate it)
        if (!bookData.id) {
            delete bookData.id;
        }

        const { data, error } = await supabase
            .from('books')
            .insert([bookData])
            .select()
            .single();

        if (error) {
            throw error;
        }

        return LibraryItem.fromRecord(data);
    } catch (error) {
        log('error', 'Failed to add book', error);
        throw handleError(error, 'Failed to add book');
    }
}

/**
 * Update an existing book
 * @param {string|number} id - Book ID
 * @param {Partial<LibraryItem>} updates - Book updates
 * @returns {Promise<LibraryItem>}
 */
async function updateBook(id, updates) {
    try {
        const supabase = getSupabaseClient();
        const updateData = { ...updates };
        
        // Remove id from updates
        delete updateData.id;
        
        // Add updated_at timestamp
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('books')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return LibraryItem.fromRecord(data);
    } catch (error) {
        log('error', 'Failed to update book', error);
        throw handleError(error, 'Failed to update book');
    }
}

/**
 * Delete a book
 * @param {string|number} id - Book ID
 * @returns {Promise<boolean>}
 */
async function deleteBook(id) {
    try {
        const supabase = getSupabaseClient();
        const { error } = await supabase
            .from('books')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        log('error', 'Failed to delete book', error);
        throw handleError(error, 'Failed to delete book');
    }
}

/**
 * Get books count (for pagination)
 * @param {string} category - Filter by category (optional)
 * @returns {Promise<number>}
 */
async function getBooksCount(category = 'all') {
    try {
        const supabase = getSupabaseClient();
        let query = supabase
            .from('books')
            .select('*', { count: 'exact', head: true });

        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        const { count, error } = await query;

        if (error) {
            throw error;
        }

        return count || 0;
    } catch (error) {
        log('error', 'Failed to get books count', error);
        return 0;
    }
}

// ES6 export
export { fetchBooks, searchBooks, getBookById, addBook, updateBook, deleteBook, getBooksCount };

// Also export for window/CommonJS compatibility
if (typeof window !== 'undefined') {
    window.libraryService = {
        fetchBooks,
        searchBooks,
        getBookById,
        addBook,
        updateBook,
        deleteBook,
        getBooksCount
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchBooks,
        searchBooks,
        getBookById,
        addBook,
        updateBook,
        deleteBook,
        getBooksCount
    };
}

