-- Library and Media Storage Database Schema
-- For Google Drive file storage system

CREATE DATABASE IF NOT EXISTS kiuma_library_media CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kiuma_library_media;

-- Library Table (Books)
CREATE TABLE IF NOT EXISTS library_books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(50) DEFAULT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    cover_image_url TEXT DEFAULT NULL,
    book_file_name VARCHAR(255) DEFAULT NULL,
    drive_file_id VARCHAR(255) DEFAULT NULL,
    direct_download_link TEXT DEFAULT NULL,
    file_size BIGINT DEFAULT NULL,
    uploaded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(255) DEFAULT NULL,
    INDEX idx_category (category),
    INDEX idx_uploaded_date (uploaded_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media Table (Videos, Audio, Images)
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
    INDEX idx_uploaded_date (uploaded_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

