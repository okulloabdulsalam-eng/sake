<?php
/**
 * Get all media files from database
 */

require_once __DIR__ . '/library_media_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $pdo = getDBConnection();
    $fileType = $_GET['type'] ?? null;
    
    $sql = "SELECT * FROM media_files ORDER BY uploaded_date DESC";
    $params = [];
    
    if ($fileType && $fileType !== 'all') {
        $sql = "SELECT * FROM media_files WHERE file_type = :file_type ORDER BY uploaded_date DESC";
        $params[':file_type'] = $fileType;
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $media = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'media' => $media
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

?>

