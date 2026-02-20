# Full-Site Search System Setup Guide

## Overview

This is a production-ready full-site search system with:
- ✅ **Indexed Search** - Fast full-text search using PostgreSQL
- ✅ **Secure RLS** - Row Level Security for authenticated and public users
- ✅ **Debounced Input** - 300ms debounce for optimal performance
- ✅ **Highlighted Results** - Search terms highlighted in results
- ✅ **Pagination** - Efficient pagination with page numbers
- ✅ **Public & Authenticated Access** - Works for all users

## Database Setup

### Step 1: Create Search Index Table

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the contents of `database/search_index_schema.sql`
5. Click **Run**

This will create:
- `search_index` table with full-text search capabilities
- RLS policies for secure access
- Helper functions for searching
- Automatic search vector updates

### Step 2: Verify Table Creation

1. Go to **Table Editor** in Supabase
2. You should see `search_index` table
3. Check that RLS is enabled (should show "RLS Enabled")

## Indexing Content

### Index Books (Automatic)

Books are automatically indexed when added/updated. To manually index all books:

```javascript
// In browser console (on any page):
import { indexAllBooks } from './js/index-books.js';
await indexAllBooks();
```

Or use the admin function:
```javascript
window.indexBooks();
```

### Index Static Pages

Static pages can be indexed manually. Create an admin page or use browser console:

```javascript
import { indexPage } from './js/index-content.js';

// Example: Index About page
await indexPage('about', 'About Us - KIUMA', 'Page content text...', '/about.html');
```

### Index Events/Activities

You can index events and activities when they're created:

```javascript
import { indexContent } from './services/searchService.js';

await indexContent({
    type: 'event',
    id: 'event-123',
    title: 'Event Title',
    content: 'Event description and details...',
    url: '/events.html#event-123',
    metadata: {
        date: '2025-01-15',
        location: 'Main Hall'
    }
});
```

## Usage

### For Users

1. Click the search bar on the homepage
2. Or navigate to `/search.html`
3. Type your search query
4. Results appear automatically (debounced)
5. Click any result to navigate to the content
6. Use pagination to see more results

### For Developers

#### Search Programmatically

```javascript
import { search } from './services/searchService.js';

const results = await search('Quran', {
    page: 1,
    limit: 20,
    types: ['book', 'page'] // Optional: filter by content types
});

console.log(results);
// {
//   results: [...],
//   total: 50,
//   page: 1,
//   limit: 20,
//   totalPages: 3
// }
```

#### Index Content

```javascript
import { indexContent } from './services/searchService.js';

await indexContent({
    type: 'book',
    id: '123',
    title: 'Book Title',
    content: 'Book description...',
    url: '/library.html#book-123',
    metadata: {
        author: 'Author Name',
        category: 'quran'
    }
});
```

## File Structure

```
├── database/
│   └── search_index_schema.sql      # Database schema
├── services/
│   └── searchService.js              # Search service (indexing & searching)
├── js/
│   ├── search.js                     # Frontend search component
│   ├── index-search.js              # Homepage search integration
│   ├── index-content.js             # Page content indexing
│   └── index-books.js                # Book indexing
├── css/
│   └── search.css                    # Search styles
├── search.html                        # Search results page
└── SEARCH_SYSTEM_SETUP.md           # This file
```

## Features

### 1. Debounced Search
- 300ms debounce delay
- Reduces API calls
- Smooth user experience

### 2. Highlighted Results
- Search terms highlighted with `<mark>` tags
- Title and snippet highlighting
- Visual feedback for matches

### 3. Pagination
- Page numbers with ellipsis
- Previous/Next buttons
- Results count display
- Smooth scrolling to results

### 4. Security (RLS)
- **Public users**: Can search (SELECT only)
- **Authenticated users**: Can index content (INSERT/UPDATE)
- **Admins**: Can delete from index

### 5. Performance
- Full-text search using PostgreSQL `tsvector`
- GIN index for fast searches
- Efficient pagination
- Cached search vectors

## RLS Policies

The system includes these RLS policies:

1. **Public Search Access**: Everyone can search
2. **Authenticated Index Access**: Authenticated users can add/update content
3. **Admin Delete Access**: Only authenticated users can delete

## Troubleshooting

### Search returns no results

1. Check if content is indexed:
   ```sql
   SELECT * FROM search_index LIMIT 10;
   ```

2. Index books manually:
   ```javascript
   await window.indexBooks();
   ```

3. Check RLS policies are correct

### Search is slow

1. Verify GIN index exists:
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'search_index';
   ```

2. Check search vector is updating:
   ```sql
   SELECT id, title, search_vector FROM search_index LIMIT 1;
   ```

### Permission errors

1. Verify RLS policies:
   - Go to Supabase Dashboard → Authentication → Policies
   - Check `search_index` table policies

2. Verify user authentication:
   ```javascript
   const { checkSupabaseAuth } = await import('./services/supabaseAuth.js');
   const auth = await checkSupabaseAuth();
   console.log(auth);
   ```

## Customization

### Change Debounce Delay

Edit `js/search.js`:
```javascript
const performSearch = debounce(async (query, page = 1) => {
    // ...
}, 500); // Change 300 to 500 for longer delay
```

### Change Results Per Page

Edit `js/search.js`:
```javascript
const results = await search(query.trim(), {
    page,
    limit: 20 // Change from 10 to 20
});
```

### Add More Content Types

1. Index the content:
```javascript
await indexContent({
    type: 'newtype',
    id: '123',
    title: 'Title',
    content: 'Content...',
    url: '/url',
    metadata: {}
});
```

2. Add icon/label in `js/search.js`:
```javascript
function getTypeIcon(type) {
    const icons = {
        // ... existing
        'newtype': 'fas fa-new-icon'
    };
    return icons[type] || 'fas fa-file';
}
```

## Production Checklist

- [ ] Run `database/search_index_schema.sql` in Supabase
- [ ] Verify RLS policies are active
- [ ] Index all existing books: `await window.indexBooks()`
- [ ] Test search functionality
- [ ] Verify pagination works
- [ ] Check mobile responsiveness
- [ ] Test with authenticated and public users
- [ ] Monitor search performance

## Support

For issues or questions:
1. Check Supabase logs for errors
2. Check browser console for JavaScript errors
3. Verify database schema is correct
4. Test RLS policies manually

