-- Media Storage Database Schema
-- For Google Drive file storage system

CREATE DATABASE IF NOT EXISTS kiuma_media_storage CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kiuma_media_storage;

-- Media Storage Table
CREATE TABLE IF NOT EXISTS media_storage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT DEFAULT NULL,
    drive_file_id VARCHAR(255) NOT NULL UNIQUE,
    direct_download_link TEXT NOT NULL,
    uploaded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(255) DEFAULT NULL,
    INDEX idx_file_type (file_type),
    INDEX idx_uploaded_date (uploaded_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

