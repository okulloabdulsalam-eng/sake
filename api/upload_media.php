<?php
/**
 * Upload Media File Metadata
 * 
 * NOTE: Files are uploaded directly to Supabase Storage from the client.
 * This endpoint only stores metadata in the database.
 * 
 * Expected JSON payload:
 * {
 *   "file_name": "example.jpg",
 *   "download_url": "https://supabase.co/storage/...",
 *   "file_type": "image",
 *   "mime_type": "image/jpeg",
 *   "file_size": 12345,
 *   "description": "Optional description",
 *   "thumbnail_url": "https://supabase.co/storage/...",
 *   "storage_path": "media/images/123456_abc.jpg",
 *   "uploaded_by": "user@example.com"
 * }
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

// Get JSON input (files are uploaded to Supabase Storage from client)
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Check admin password
$password = $data['password'] ?? $_POST['password'] ?? $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
if ($password !== ADMIN_PASSWORD) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Admin password required.']);
    exit;
}

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit;
}

// Extract data from JSON
$fileName = $data['file_name'] ?? null;
$downloadUrl = $data['download_url'] ?? null;
$fileType = $data['file_type'] ?? null;
$mimeType = $data['mime_type'] ?? null;
$fileSize = $data['file_size'] ?? 0;
$description = $data['description'] ?? null;
$thumbnailUrl = $data['thumbnail_url'] ?? null;
$storagePath = $data['storage_path'] ?? null;
$uploadedBy = $data['uploaded_by'] ?? ($_SERVER['REMOTE_ADDR'] ?? 'Unknown');

// Validate required fields
if (!$fileName || !$downloadUrl || !$fileType || !$mimeType) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields: file_name, download_url, file_type, mime_type']);
    exit;
}

// Validate MIME type
if (!isAllowedMediaType($mimeType)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'File type not allowed']);
    exit;
}

try {
    // Store metadata in database
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("
        INSERT INTO media_files (file_name, file_type, mime_type, file_size, drive_file_id, direct_download_link, thumbnail_url, description, uploaded_by)
        VALUES (:file_name, :file_type, :mime_type, :file_size, :drive_file_id, :direct_download_link, :thumbnail_url, :description, :uploaded_by)
    ");
    
    // Use storage_path for drive_file_id column (for backward compatibility)
    $driveFileId = $storagePath ?: $downloadUrl;
    
    $stmt->execute([
        ':file_name' => $fileName,
        ':file_type' => $fileType,
        ':mime_type' => $mimeType,
        ':file_size' => $fileSize,
        ':drive_file_id' => $driveFileId,
        ':direct_download_link' => $downloadUrl,
        ':thumbnail_url' => $thumbnailUrl,
        ':description' => $description,
        ':uploaded_by' => $uploadedBy
    ]);
    
    $mediaId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Media metadata saved successfully',
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

