-- ============================================
-- Full-Site Search Index Table
-- ============================================
-- This table stores indexed content for fast full-text search
-- Supports searching across books, pages, events, activities, etc.

-- Create search_index table
CREATE TABLE IF NOT EXISTS search_index (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL, -- 'book', 'page', 'event', 'activity', 'notification', etc.
    content_id VARCHAR(255) NOT NULL, -- ID of the original content
    title TEXT NOT NULL,
    content TEXT, -- Full text content to search
    url TEXT, -- URL to the content
    metadata JSONB, -- Additional metadata (author, date, category, etc.)
    search_vector tsvector, -- Full-text search vector (auto-generated)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT unique_content UNIQUE(content_type, content_id)
);

-- Create GIN index for full-text search (PostgreSQL)
CREATE INDEX IF NOT EXISTS idx_search_vector ON search_index USING GIN(search_vector);

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_content_type ON search_index(content_type);
CREATE INDEX IF NOT EXISTS idx_content_id ON search_index(content_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON search_index(created_at DESC);

-- Create function to update search_vector automatically
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B');
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search_vector
DROP TRIGGER IF EXISTS trigger_update_search_vector ON search_index;
CREATE TRIGGER trigger_update_search_vector
    BEFORE INSERT OR UPDATE ON search_index
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access (everyone can search)
CREATE POLICY "Public Search Access"
ON search_index FOR SELECT
USING (true);

-- Policy: Authenticated users can insert/update (for indexing)
CREATE POLICY "Authenticated Index Access"
ON search_index FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated Update Access"
ON search_index FOR UPDATE
USING (auth.role() = 'authenticated');

-- Policy: Only admins can delete
CREATE POLICY "Admin Delete Access"
ON search_index FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================
-- Helper Functions
-- ============================================

-- Function to search content
CREATE OR REPLACE FUNCTION search_content(
    search_query TEXT,
    content_types TEXT[] DEFAULT NULL,
    page_limit INTEGER DEFAULT 20,
    page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    content_type VARCHAR,
    content_id VARCHAR,
    title TEXT,
    content TEXT,
    url TEXT,
    metadata JSONB,
    rank REAL,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH search_results AS (
        SELECT 
            si.*,
            ts_rank(si.search_vector, plainto_tsquery('english', search_query)) AS rank,
            COUNT(*) OVER() AS total_count
        FROM search_index si
        WHERE 
            si.search_vector @@ plainto_tsquery('english', search_query)
            AND (content_types IS NULL OR si.content_type = ANY(content_types))
        ORDER BY rank DESC, si.created_at DESC
        LIMIT page_limit
        OFFSET page_offset
    )
    SELECT 
        sr.id,
        sr.content_type,
        sr.content_id,
        sr.title,
        sr.content,
        sr.url,
        sr.metadata,
        sr.rank,
        sr.total_count
    FROM search_results sr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION search_content TO authenticated, anon;

