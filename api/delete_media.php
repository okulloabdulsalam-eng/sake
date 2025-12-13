<?php
/**
 * Delete media file from Firebase Storage and database
 * Note: Firebase Storage deletion should be done from the client side
 * This endpoint only removes the database record
 */

require_once __DIR__ . '/library_media_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Check authentication token (Firebase ID token)
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = null;

if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    $token = $matches[1];
}

// For now, we'll check admin password as fallback (will be replaced with Firebase Auth)
$password = $_POST['password'] ?? $_GET['password'] ?? '';
$isAuthorized = false;

// TODO: Verify Firebase ID token here
// For now, using password as fallback
if ($password === ADMIN_PASSWORD) {
    $isAuthorized = true;
}

if (!$isAuthorized) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$mediaId = $_POST['id'] ?? $_GET['id'] ?? null;

if (!$mediaId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Media ID required']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Get media info
    $stmt = $pdo->prepare("SELECT * FROM media_files WHERE id = :id");
    $stmt->execute([':id' => $mediaId]);
    $media = $stmt->fetch();
    
    if (!$media) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Media not found']);
        exit;
    }
    
    // Note: Firebase Storage file deletion should be handled by the client
    // The client should delete the file from Firebase Storage before calling this endpoint
    // or this endpoint can return the storage path for the client to delete
    
    // Delete from database
    $stmt = $pdo->prepare("DELETE FROM media_files WHERE id = :id");
    $stmt->execute([':id' => $mediaId]);
    
    echo json_encode([
        'success' => true, 
        'message' => 'Media deleted successfully',
        'storage_path' => $media['drive_file_id'] // Return storage path for client to delete if needed
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

?>

