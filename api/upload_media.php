<?php
/**
 * Upload Media File (Video, Audio, Image) to Google Drive
 */

require_once __DIR__ . '/library_media_config.php';
require_once __DIR__ . '/../media-storage/vendor/autoload.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

if (!isset($_FILES['mediaFile']) || $_FILES['mediaFile']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No file uploaded or upload error']);
    exit;
}

$file = $_FILES['mediaFile'];
$fileName = $file['name'];
$fileTmpPath = $file['tmp_name'];
$fileSize = $file['size'];
$fileType = $file['type'];
$description = $_POST['description'] ?? '';

// Validate file size
if ($fileSize > MAX_FILE_SIZE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'File size exceeds maximum allowed size']);
    exit;
}

// Validate MIME type
if (!isAllowedMediaType($fileType)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'File type not allowed']);
    exit;
}

$mediaCategory = getMediaTypeCategory($fileType);

try {
    // Initialize Google Drive API Client
    $client = new Google_Client();
    $client->setAuthConfig(GOOGLE_CREDENTIALS_PATH);
    $client->addScope(Google_Service_Drive::DRIVE_FILE);
    $client->setAccessType('offline');
    
    $accessToken = getAccessToken($client);
    $client->setAccessToken($accessToken);
    
    $driveService = new Google_Service_Drive($client);
    
    // Prepare file metadata
    $fileMetadata = new Google_Service_Drive_DriveFile([
        'name' => $fileName
    ]);
    
    if (!empty(GOOGLE_DRIVE_MEDIA_FOLDER_ID)) {
        $fileMetadata->setParents([GOOGLE_DRIVE_MEDIA_FOLDER_ID]);
    }
    
    // Upload to Google Drive
    $content = file_get_contents($fileTmpPath);
    $uploadedFile = $driveService->files->create(
        $fileMetadata,
        [
            'data' => $content,
            'mimeType' => $fileType,
            'uploadType' => 'multipart',
            'fields' => 'id, name, webViewLink'
        ]
    );
    
    $driveFileId = $uploadedFile->getId();
    $directDownloadLink = 'https://drive.google.com/uc?export=download&id=' . $driveFileId;
    
    // Generate thumbnail for images
    $thumbnailUrl = null;
    if ($mediaCategory === 'image') {
        $thumbnailUrl = $directDownloadLink; // Use same link for images
    }
    
    // Store in database
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("
        INSERT INTO media_files (file_name, file_type, mime_type, file_size, drive_file_id, direct_download_link, thumbnail_url, description, uploaded_by)
        VALUES (:file_name, :file_type, :mime_type, :file_size, :drive_file_id, :direct_download_link, :thumbnail_url, :description, :uploaded_by)
    ");
    
    $uploadedBy = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
    
    $stmt->execute([
        ':file_name' => $fileName,
        ':file_type' => $mediaCategory,
        ':mime_type' => $fileType,
        ':file_size' => $fileSize,
        ':drive_file_id' => $driveFileId,
        ':direct_download_link' => $directDownloadLink,
        ':thumbnail_url' => $thumbnailUrl,
        ':description' => $description ?: null,
        ':uploaded_by' => $uploadedBy
    ]);
    
    $mediaId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Media file uploaded successfully',
        'media_id' => $mediaId,
        'file_type' => $mediaCategory,
        'download_link' => $directDownloadLink,
        'thumbnail_url' => $thumbnailUrl
    ]);
    
} catch (Google_Service_Exception $e) {
    error_log("Google Drive API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Google Drive API error']);
} catch (PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
} catch (Exception $e) {
    error_log("General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

?>

