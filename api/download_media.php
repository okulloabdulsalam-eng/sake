<?php
/**
 * Redirect to Supabase Storage Download URL
 * Files are stored in Supabase Storage, so we redirect to the stored URL
 */

require_once __DIR__ . '/library_media_config.php';
// No longer need Google Drive API - files are in Supabase Storage

header('Access-Control-Allow-Origin: *');

$mediaId = $_GET['id'] ?? null;

if (!$mediaId) {
    http_response_code(400);
    die('Media ID required');
}

try {
    $pdo = getDBConnection();
    
    // Get media file info
    $stmt = $pdo->prepare("SELECT * FROM media_files WHERE id = :id");
    $stmt->execute([':id' => $mediaId]);
    $media = $stmt->fetch();
    
    if (!$media) {
        http_response_code(404);
        die('Media file not found');
    }
    
    // Get Supabase Storage URL from database
    $downloadUrl = $media['direct_download_link'];
    
    if (empty($downloadUrl)) {
        http_response_code(404);
        die('Download URL not found');
    }
    
    // Redirect to Supabase Storage URL
    header('Location: ' . $downloadUrl);
    exit;
} catch (PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    http_response_code(500);
    die('Database error');
} catch (Exception $e) {
    error_log("General Error: " . $e->getMessage());
    http_response_code(500);
    die('Error: ' . $e->getMessage());
}

?>

