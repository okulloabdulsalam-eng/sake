-- =====================================================
-- KIUMA Complete Database Schema for XAMPP/MySQL
-- =====================================================
-- This file contains all tables needed for the KIUMA system
-- Run this in phpMyAdmin or via MySQL command line
-- =====================================================

-- Create main database
CREATE DATABASE IF NOT EXISTS kiuma_main CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kiuma_main;

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
-- For user accounts (registration, login)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    firstName VARCHAR(100) DEFAULT NULL,
    lastName VARCHAR(100) DEFAULT NULL,
    name VARCHAR(255) DEFAULT NULL,
    whatsapp VARCHAR(20) DEFAULT NULL,
    gender ENUM('Male', 'Female', 'Other') DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. LIBRARY BOOKS TABLE
-- =====================================================
-- For book library with Google Drive integration
CREATE TABLE IF NOT EXISTS library_books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(50) DEFAULT NULL,
    category ENUM('islamic', 'quran', 'educational', 'other') NOT NULL,
    description TEXT DEFAULT NULL,
    cover_image_url TEXT DEFAULT NULL,
    book_file_name VARCHAR(255) DEFAULT NULL,
    drive_file_id VARCHAR(255) DEFAULT NULL,
    direct_download_link TEXT DEFAULT NULL,
    file_size BIGINT DEFAULT NULL,
    uploaded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(255) DEFAULT NULL,
    INDEX idx_category (category),
    INDEX idx_uploaded_date (uploaded_date),
    INDEX idx_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. MEDIA FILES TABLE
-- =====================================================
-- For videos, audio, and images with Google Drive integration
CREATE TABLE IF NOT EXISTS media_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type ENUM('video', 'audio', 'image') NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT DEFAULT NULL,
    drive_file_id VARCHAR(255) NOT NULL UNIQUE,
    direct_download_link TEXT NOT NULL,
    thumbnail_url TEXT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    uploaded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(255) DEFAULT NULL,
    INDEX idx_file_type (file_type),
    INDEX idx_uploaded_date (uploaded_date),
    INDEX idx_file_name (file_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. NOTIFICATIONS TABLE
-- =====================================================
-- For storing system notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'reminder', 'announcement', 'white_days', 'fasting') DEFAULT 'info',
    target_audience ENUM('all', 'male', 'female', 'specific') DEFAULT 'all',
    sent_to_whatsapp BOOLEAN DEFAULT FALSE,
    sent_to_email BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_date TIMESTAMP NULL DEFAULT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    INDEX idx_type (type),
    INDEX idx_created_date (created_date),
    INDEX idx_sent_date (sent_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. PRAYER TIMES TABLE
-- =====================================================
-- For storing prayer times (can be updated by admin)
CREATE TABLE IF NOT EXISTS prayer_times (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prayer_name ENUM('fajr', 'dhuhr', 'asr', 'maghrib', 'isha') NOT NULL,
    adhan_time TIME NOT NULL,
    iqaama_time TIME NOT NULL,
    date DATE NOT NULL,
    updated_by VARCHAR(255) DEFAULT NULL,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_prayer_date (prayer_name, date),
    INDEX idx_date (date),
    INDEX idx_prayer_name (prayer_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. RECRUITMENT TABLE
-- =====================================================
-- For recruitment form submissions
CREATE TABLE IF NOT EXISTS recruits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(100) DEFAULT NULL,
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    notes TEXT DEFAULT NULL,
    INDEX idx_email (email),
    INDEX idx_date_joined (date_joined),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. EVENTS TABLE
-- =====================================================
-- For storing events information
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    event_date DATE NOT NULL,
    event_time TIME DEFAULT NULL,
    location VARCHAR(255) DEFAULT NULL,
    image_url TEXT DEFAULT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255) DEFAULT NULL,
    INDEX idx_event_date (event_date),
    INDEX idx_created_date (created_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. ACTIVITIES TABLE
-- =====================================================
-- For storing activities information
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL,
    image_url TEXT DEFAULT NULL,
    link_url TEXT DEFAULT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255) DEFAULT NULL,
    INDEX idx_category (category),
    INDEX idx_created_date (created_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. QUESTIONS TABLE
-- =====================================================
-- For storing questions from users
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    user_name VARCHAR(255) DEFAULT NULL,
    user_email VARCHAR(255) DEFAULT NULL,
    question TEXT NOT NULL,
    answer TEXT DEFAULT NULL,
    status ENUM('pending', 'answered', 'archived') DEFAULT 'pending',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answered_date TIMESTAMP NULL DEFAULT NULL,
    answered_by VARCHAR(255) DEFAULT NULL,
    INDEX idx_status (status),
    INDEX idx_created_date (created_date),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. PAYMENTS TABLE
-- =====================================================
-- For tracking payments/donations
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'UGX',
    payment_method VARCHAR(50) DEFAULT NULL,
    purpose VARCHAR(255) DEFAULT NULL,
    transaction_id VARCHAR(255) DEFAULT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_date TIMESTAMP NULL DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_date (created_date),
    INDEX idx_transaction_id (transaction_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 11. ADMIN LOGS TABLE
-- =====================================================
-- For tracking admin actions
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) DEFAULT NULL,
    record_id INT DEFAULT NULL,
    details TEXT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_user (admin_user),
    INDEX idx_action (action),
    INDEX idx_created_date (created_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERT DEFAULT DATA (Optional)
-- =====================================================

-- Insert default prayer times (example - update as needed)
INSERT INTO prayer_times (prayer_name, adhan_time, iqaama_time, date) VALUES
('fajr', '05:30:00', '05:40:00', CURDATE()),
('dhuhr', '12:15:00', '12:25:00', CURDATE()),
('asr', '15:45:00', '15:55:00', CURDATE()),
('maghrib', '18:20:00', '18:25:00', CURDATE()),
('isha', '19:45:00', '19:55:00', CURDATE())
ON DUPLICATE KEY UPDATE
    adhan_time = VALUES(adhan_time),
    iqaama_time = VALUES(iqaama_time);

-- =====================================================
-- END OF SCHEMA
-- =====================================================

