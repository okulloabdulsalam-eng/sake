-- KIUMA Recruitment Database Schema
-- Create database (run this first if database doesn't exist)
-- CREATE DATABASE IF NOT EXISTS kiuma_recruitment CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE kiuma_recruitment;

-- Create recruits table
CREATE TABLE IF NOT EXISTS `recruits` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `fullname` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `role` VARCHAR(100) DEFAULT NULL,
    `date_joined` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_email` (`email`),
    INDEX `idx_date_joined` (`date_joined`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

