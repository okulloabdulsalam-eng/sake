<?php
/**
 * Media Storage Configuration Example
 * Copy this file to config.php and update with your settings
 */

// ============================================
// DATABASE CONFIGURATION
// ============================================
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'kiuma_media_storage');

// ============================================
// GOOGLE DRIVE API CONFIGURATION
// ============================================
// Path to your Google Drive API credentials JSON file
define('GOOGLE_CREDENTIALS_PATH', __DIR__ . '/credentials.json');

// Google Drive folder ID where files will be stored (optional)
define('GOOGLE_DRIVE_FOLDER_ID', '');

// ============================================
// FILE UPLOAD CONFIGURATION
// ============================================
define('MAX_FILE_SIZE', 100 * 1024 * 1024); // 100MB

// Allowed MIME types
define('ALLOWED_MIME_TYPES', [
    'video/mp4',
    'video/x-matroska',
    'video/quicktime',
    'video/x-msvideo',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/ogg',
    'audio/webm',
    'audio/aac',
    'audio/flac',
    'audio/x-m4a',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
]);

// ============================================
// SECURITY CONFIGURATION
// ============================================
define('ADMIN_PASSWORD', 'CHANGE_THIS_PASSWORD'); // Change this!

// ============================================
// DATABASE CONNECTION FUNCTION
// ============================================
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection error: " . $e->getMessage());
        die("Database connection failed. Please check your configuration in config.php");
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function isAllowedMimeType($mimeType) {
    return in_array($mimeType, ALLOWED_MIME_TYPES);
}

function formatFileSize($bytes) {
    if ($bytes >= 1073741824) {
        return number_format($bytes / 1073741824, 2) . ' GB';
    } elseif ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 2) . ' MB';
    } elseif ($bytes >= 1024) {
        return number_format($bytes / 1024, 2) . ' KB';
    } else {
        return $bytes . ' bytes';
    }
}

function getFileTypeCategory($mimeType) {
    if (strpos($mimeType, 'video/') === 0) {
        return 'Video';
    } elseif (strpos($mimeType, 'audio/') === 0) {
        return 'Audio';
    } else {
        return 'Document';
    }
}

?>

