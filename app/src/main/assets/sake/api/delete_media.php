<?php
/**
 * Delete media file metadata from database
 * 
 * NOTE: File deletion from Supabase Storage is handled by the client.
 * This endpoint only removes the database record.
 */

require_once __DIR__ . '/library_media_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Check admin password
$password = $_POST['password'] ?? $_GET['password'] ?? '';
if ($password !== ADMIN_PASSWORD) {
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
    
    // Note: File deletion from Supabase Storage is handled by the client
    // The client calls deleteFromSupabaseStorage() before calling this API
    // This endpoint only deletes the database record
    
    // Delete from database
    $stmt = $pdo->prepare("DELETE FROM media_files WHERE id = :id");
    $stmt->execute([':id' => $mediaId]);
    
    echo json_encode(['success' => true, 'message' => 'Media deleted successfully']);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
}

?>

