/**
 * Full-Site Search Service
 * 
 * Handles indexing and searching content across the entire site
 * Uses Supabase with full-text search capabilities
 */

import { getSupabaseClient } from './supabaseClient.js';

/**
 * Index a piece of content for search
 * @param {Object} content - Content to index
 * @param {string} content.type - Content type ('book', 'page', 'event', etc.)
 * @param {string} content.id - Content ID
 * @param {string} content.title - Title
 * @param {string} content.content - Full text content
 * @param {string} content.url - URL to the content
 * @param {Object} content.metadata - Additional metadata (author, date, category, etc.)
 * @returns {Promise<Object>} Indexed content
 */
async function indexContent(content) {
    try {
        const supabase = getSupabaseClient();
        
        const { data, error } = await supabase
            .from('search_index')
            .upsert({
                content_type: content.type,
                content_id: content.id,
                title: content.title,
                content: content.content || '',
                url: content.url,
                metadata: content.metadata || {},
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'content_type,content_id'
            })
            .select()
            .single();

        if (error) {
            console.error('[Search] Error indexing content:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('[Search] Failed to index content:', error);
        throw error;
    }
}

/**
 * Search across all indexed content
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {string[]} options.types - Filter by content types
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Results per page (default: 20)
 * @returns {Promise<Object>} Search results with pagination
 */
async function search(query, options = {}) {
    try {
        const supabase = getSupabaseClient();
        
        if (!query || query.trim().length === 0) {
            return {
                results: [],
                total: 0,
                page: options.page || 1,
                limit: options.limit || 20,
                totalPages: 0
            };
        }

        const page = options.page || 1;
        const limit = options.limit || 20;
        const offset = (page - 1) * limit;
        const types = options.types || null;

        // Use the search_content function for better performance
        const { data, error } = await supabase.rpc('search_content', {
            search_query: query.trim(),
            content_types: types,
            page_limit: limit,
            page_offset: offset
        });

        if (error) {
            // Fallback to manual search if function doesn't exist
            console.warn('[Search] RPC function not available, using fallback:', error);
            return await searchFallback(query, options);
        }

        if (!data || data.length === 0) {
            return {
                results: [],
                total: 0,
                page,
                limit,
                totalPages: 0
            };
        }

        // Extract total count from first result
        const total = data[0]?.total_count || 0;
        const totalPages = Math.ceil(total / limit);

        // Format results
        const results = data.map(item => ({
            id: item.id,
            type: item.content_type,
            contentId: item.content_id,
            title: item.title,
            content: item.content,
            url: item.url,
            metadata: item.metadata,
            rank: item.rank
        }));

        return {
            results,
            total,
            page,
            limit,
            totalPages
        };
    } catch (error) {
        console.error('[Search] Search error:', error);
        throw error;
    }
}

/**
 * Fallback search using direct Supabase query
 * @private
 */
async function searchFallback(query, options = {}) {
    const supabase = getSupabaseClient();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    // Build query
    let searchQuery = supabase
        .from('search_index')
        .select('*', { count: 'exact' });

    // Filter by content types if specified
    if (options.types && options.types.length > 0) {
        searchQuery = searchQuery.in('content_type', options.types);
    }

    // Full-text search on title and content
    const searchTerm = `%${query.trim()}%`;
    searchQuery = searchQuery.or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`);

    // Order by relevance (title matches first, then content)
    searchQuery = searchQuery
        .order('title', { ascending: true })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    const { data, error, count } = await searchQuery;

    if (error) {
        throw error;
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const results = (data || []).map(item => ({
        id: item.id,
        type: item.content_type,
        contentId: item.content_id,
        title: item.title,
        content: item.content,
        url: item.url,
        metadata: item.metadata,
        rank: 1.0 // Default rank for fallback
    }));

    return {
        results,
        total,
        page,
        limit,
        totalPages
    };
}

/**
 * Index all books from the books table
 */
async function indexAllBooks() {
    try {
        const supabase = getSupabaseClient();
        
        // Fetch all books
        const { data: books, error } = await supabase
            .from('books')
            .select('*');

        if (error) {
            throw error;
        }

        if (!books || books.length === 0) {
            console.log('[Search] No books to index');
            return { indexed: 0 };
        }

        // Index each book
        let indexed = 0;
        for (const book of books) {
            try {
                await indexContent({
                    type: 'book',
                    id: String(book.id),
                    title: book.title || '',
                    content: `${book.title || ''} ${book.author || ''} ${book.description || ''}`.trim(),
                    url: `/library.html#book-${book.id}`,
                    metadata: {
                        author: book.author,
                        category: book.category,
                        isbn: book.isbn
                    }
                });
                indexed++;
            } catch (err) {
                console.error(`[Search] Failed to index book ${book.id}:`, err);
            }
        }

        console.log(`[Search] Indexed ${indexed} books`);
        return { indexed };
    } catch (error) {
        console.error('[Search] Error indexing books:', error);
        throw error;
    }
}

/**
 * Remove content from search index
 * @param {string} type - Content type
 * @param {string} id - Content ID
 */
async function removeFromIndex(type, id) {
    try {
        const supabase = getSupabaseClient();
        
        const { error } = await supabase
            .from('search_index')
            .delete()
            .eq('content_type', type)
            .eq('content_id', String(id));

        if (error) {
            throw error;
        }

        return { success: true };
    } catch (error) {
        console.error('[Search] Error removing from index:', error);
        throw error;
    }
}

/**
 * Clear all indexed content (admin only)
 */
async function clearIndex() {
    try {
        const supabase = getSupabaseClient();
        
        const { error } = await supabase
            .from('search_index')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (error) {
            throw error;
        }

        return { success: true };
    } catch (error) {
        console.error('[Search] Error clearing index:', error);
        throw error;
    }
}

export {
    indexContent,
    search,
    indexAllBooks,
    removeFromIndex,
    clearIndex
};

