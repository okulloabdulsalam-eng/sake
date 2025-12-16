/**
 * LibraryItem Model
 * 
 * Represents a book/document in the library
 */

class LibraryItem {
    constructor(data = {}) {
        this.id = data.id || null;
        this.title = data.title || '';
        this.author = data.author || '';
        this.description = data.description || '';
        this.coverUrl = data.coverUrl || data.cover_url || '';
        this.fileUrl = data.fileUrl || data.file_url || '';
        this.type = data.type || 'pdf'; // pdf, epub, audio
        this.category = data.category || 'all'; // all, islamic, educational, quran
        this.isbn = data.isbn || '';
        this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
        this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString();
    }

    /**
     * Convert to plain object for database storage
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            author: this.author,
            description: this.description,
            cover_url: this.coverUrl,
            file_url: this.fileUrl,
            type: this.type,
            category: this.category,
            isbn: this.isbn,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }

    /**
     * Create from database record
     */
    static fromRecord(record) {
        return new LibraryItem({
            id: record.id,
            title: record.title,
            author: record.author,
            description: record.description,
            coverUrl: record.cover_url,
            fileUrl: record.file_url,
            type: record.type,
            category: record.category,
            isbn: record.isbn,
            createdAt: record.created_at,
            updatedAt: record.updated_at
        });
    }

    /**
     * Validate item data
     */
    validate() {
        const errors = [];

        if (!this.title || this.title.trim().length === 0) {
            errors.push('Title is required');
        }
        if (this.title && this.title.length > 200) {
            errors.push('Title must be 200 characters or less');
        }

        if (!this.author || this.author.trim().length === 0) {
            errors.push('Author is required');
        }
        if (this.author && this.author.length > 100) {
            errors.push('Author must be 100 characters or less');
        }

        if (this.description && this.description.length > 2000) {
            errors.push('Description must be 2000 characters or less');
        }

        if (this.isbn && this.isbn.length > 20) {
            errors.push('ISBN must be 20 characters or less');
        }

        if (this.coverUrl && !this.isValidUrl(this.coverUrl)) {
            errors.push('Cover URL must be a valid HTTP/HTTPS URL or data URL');
        }

        if (this.fileUrl && !this.isValidUrl(this.fileUrl)) {
            errors.push('File URL must be a valid HTTP/HTTPS URL');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Check if URL is valid
     */
    isValidUrl(url) {
        if (url.startsWith('data:')) return true;
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    }
}

// ES6 export
export { LibraryItem };

// Also export for window/CommonJS compatibility
if (typeof window !== 'undefined') {
    window.LibraryItem = LibraryItem;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LibraryItem;
}

