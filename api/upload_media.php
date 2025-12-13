<?php
/**
 * Save Media File Metadata to Database
 * File is uploaded directly to Firebase Storage by the client
 */

require_once __DIR__ . '/library_media_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($input['file_name']) || !isset($input['download_url']) || !isset($input['file_type'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$fileName = $input['file_name'];
$downloadUrl = $input['download_url'];
$fileType = $input['file_type']; // 'video', 'audio', or 'image'
$mimeType = $input['mime_type'] ?? '';
$fileSize = $input['file_size'] ?? 0;
$description = $input['description'] ?? '';
$thumbnailUrl = $input['thumbnail_url'] ?? null;
$storagePath = $input['storage_path'] ?? ''; // Path in Firebase Storage for deletion

// Validate file type
$allowedTypes = ['video', 'audio', 'image'];
if (!in_array($fileType, $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid file type']);
    exit;
}

try {
    // Store in database
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("
        INSERT INTO media_files (
            file_name, 
            file_type, 
            mime_type, 
            file_size, 
            drive_file_id, 
            direct_download_link, 
            thumbnail_url, 
            description, 
            uploaded_by
        )
        VALUES (
            :file_name, 
            :file_type, 
            :mime_type, 
            :file_size, 
            :storage_path, 
            :direct_download_link, 
            :thumbnail_url, 
            :description, 
            :uploaded_by
        )
    ");
    
    $uploadedBy = $input['uploaded_by'] ?? ($_SERVER['REMOTE_ADDR'] ?? 'Unknown');
    
    // Use download_url as thumbnail for images if not provided
    if ($fileType === 'image' && !$thumbnailUrl) {
        $thumbnailUrl = $downloadUrl;
    }
    
    $stmt->execute([
        ':file_name' => $fileName,
        ':file_type' => $fileType,
        ':mime_type' => $mimeType,
        ':file_size' => $fileSize,
        ':storage_path' => $storagePath, // Store Firebase Storage path in drive_file_id column
        ':direct_download_link' => $downloadUrl,
        ':thumbnail_url' => $thumbnailUrl,
        ':description' => $description ?: null,
        ':uploaded_by' => $uploadedBy
    ]);
    
    $mediaId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Media file saved successfully',
        'media_id' => $mediaId,
        'file_type' => $fileType,
        'download_link' => $downloadUrl,
        'thumbnail_url' => $thumbnailUrl
    ]);
    
} catch (PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

?>

