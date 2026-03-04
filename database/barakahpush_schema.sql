-- BarakahPush Notification System – Active
-- Database schema for notifications, user tokens, and preferences

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_by_admin BOOLEAN DEFAULT false,
    email_enabled BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- User FCM tokens table
CREATE TABLE IF NOT EXISTS user_tokens (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL,
    platform VARCHAR(20) DEFAULT 'web',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, fcm_token)
);

-- User notification preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    allow_email BOOLEAN DEFAULT true,
    allow_push BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_tokens_fcm_token ON user_tokens(fcm_token);
CREATE INDEX IF NOT EXISTS idx_user_tokens_platform ON user_tokens(platform);

-- Enable Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Admins can insert notifications (will be handled by Cloud Functions)
CREATE POLICY "Admins can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true); -- Cloud Functions will handle admin check

-- RLS Policies for user_tokens
-- Users can only see their own tokens
CREATE POLICY "Users can view own tokens"
    ON user_tokens FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert/update their own tokens
CREATE POLICY "Users can manage own tokens"
    ON user_tokens FOR ALL
    USING (auth.uid() = user_id);

-- RLS Policies for user_preferences
-- Users can only see their own preferences
CREATE POLICY "Users can view own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
    ON user_preferences FOR ALL
    USING (auth.uid() = user_id);

