<?php
/**
 * Library and Media Configuration
 * Google Drive + MySQL Configuration
 */

// ============================================
// DATABASE CONFIGURATION
// ============================================
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'kiuma_main');

// ============================================
// GOOGLE DRIVE API CONFIGURATION
// ============================================
// Path to your Google Drive API credentials JSON file
define('GOOGLE_CREDENTIALS_PATH', __DIR__ . '/../media-storage/credentials.json');

// Google Drive folder IDs (optional - leave empty for root)
define('GOOGLE_DRIVE_LIBRARY_FOLDER_ID', ''); // For books
define('GOOGLE_DRIVE_MEDIA_FOLDER_ID', '');   // For media files

// ============================================
// FILE UPLOAD CONFIGURATION
// ============================================
define('MAX_FILE_SIZE', 500 * 1024 * 1024); // 500MB

// Allowed MIME types for Media (Video, Audio, Images)
define('ALLOWED_MEDIA_TYPES', [
    // Videos
    'video/mp4',
    'video/x-matroska',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    
    // Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/ogg',
    'audio/webm',
    'audio/aac',
    'audio/flac',
    'audio/x-m4a',
    
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
]);

// Allowed MIME types for Library (Books - PDF, DOC, etc.)
define('ALLOWED_BOOK_TYPES', [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/epub+zip',
    'text/plain'
]);

// ============================================
// SECURITY CONFIGURATION
// ============================================
define('ADMIN_PASSWORD', 'kiuma2024'); // Change this!

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
        die(json_encode(['success' => false, 'message' => 'Database connection failed']));
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function isAllowedMediaType($mimeType) {
    return in_array($mimeType, ALLOWED_MEDIA_TYPES);
}

function isAllowedBookType($mimeType) {
    return in_array($mimeType, ALLOWED_BOOK_TYPES);
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

function getMediaTypeCategory($mimeType) {
    if (strpos($mimeType, 'video/') === 0) {
        return 'video';
    } elseif (strpos($mimeType, 'audio/') === 0) {
        return 'audio';
    } elseif (strpos($mimeType, 'image/') === 0) {
        return 'image';
    }
    return 'unknown';
}

function getAccessToken($client) {
    $tokenPath = __DIR__ . '/../media-storage/token.json';
    
    if (file_exists($tokenPath)) {
        $accessToken = json_decode(file_get_contents($tokenPath), true);
        $client->setAccessToken($accessToken);
    }
    
    if ($client->isAccessTokenExpired()) {
        if ($client->getRefreshToken()) {
            $client->fetchAccessTokenWithRefreshToken($client->getRefreshToken());
        } else {
            throw new Exception('Authorization required. Please run authorization first.');
        }
        
        if (!file_exists(dirname($tokenPath))) {
            mkdir(dirname($tokenPath), 0700, true);
        }
        file_put_contents($tokenPath, json_encode($client->getAccessToken()));
    }
    
    return $client->getAccessToken();
}

?>

