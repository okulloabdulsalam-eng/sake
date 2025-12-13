<?php
/**
 * Redirect to Firebase Storage Download URL
 * Files are stored in Firebase Storage, so we redirect to the stored URL
 */

require_once __DIR__ . '/library_media_config.php';

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
    
    // Redirect to Firebase Storage download URL
    $downloadUrl = $media['direct_download_link'];
    
    if (empty($downloadUrl)) {
        http_response_code(404);
        die('Download URL not found');
    }
    
    // Redirect to Firebase Storage URL
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

