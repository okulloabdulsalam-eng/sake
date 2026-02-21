<?php
/**
 * Upload Media File to Google Drive
 * Handles file upload, validation, Google Drive storage, and database entry
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/vendor/autoload.php'; // Google API Client

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Check if file was uploaded
if (!isset($_FILES['mediaFile']) || $_FILES['mediaFile']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'No file uploaded or upload error occurred'
    ]);
    exit;
}

$file = $_FILES['mediaFile'];
$fileName = $file['name'];
$fileTmpPath = $file['tmp_name'];
$fileSize = $file['size'];
$fileType = $file['type'];

// Validate file size
if ($fileSize > MAX_FILE_SIZE) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'File size exceeds maximum allowed size of ' . formatFileSize(MAX_FILE_SIZE)
    ]);
    exit;
}

// Validate MIME type
if (!isAllowedMimeType($fileType)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'File type not allowed. Allowed types: Videos (MP4, MKV), Audio (MP3, WAV), Documents (PDF, DOC, DOCX)'
    ]);
    exit;
}

try {
    // Initialize Google Drive API Client
    $client = new Google_Client();
    $client->setAuthConfig(GOOGLE_CREDENTIALS_PATH);
    $client->addScope(Google_Service_Drive::DRIVE_FILE);
    $client->setAccessType('offline');
    
    // Get access token (or refresh if needed)
    $accessToken = getAccessToken($client);
    $client->setAccessToken($accessToken);
    
    // Create Drive service
    $driveService = new Google_Service_Drive($client);
    
    // Prepare file metadata
    $fileMetadata = new Google_Service_Drive_DriveFile([
        'name' => $fileName
    ]);
    
    // If folder ID is specified, set parent folder
    if (!empty(GOOGLE_DRIVE_FOLDER_ID)) {
        $fileMetadata->setParents([GOOGLE_DRIVE_FOLDER_ID]);
    }
    
    // Upload file to Google Drive
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
    
    // Generate direct download link
    $directDownloadLink = 'https://drive.google.com/uc?export=download&id=' . $driveFileId;
    
    // Store in database
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("
        INSERT INTO media_storage (file_name, file_type, file_size, drive_file_id, direct_download_link, uploaded_by)
        VALUES (:file_name, :file_type, :file_size, :drive_file_id, :direct_download_link, :uploaded_by)
    ");
    
    $uploadedBy = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
    
    $stmt->execute([
        ':file_name' => $fileName,
        ':file_type' => getFileTypeCategory($fileType),
        ':file_size' => $fileSize,
        ':drive_file_id' => $driveFileId,
        ':direct_download_link' => $directDownloadLink,
        ':uploaded_by' => $uploadedBy
    ]);
    
    // Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'File uploaded successfully',
        'file_id' => $driveFileId,
        'file_name' => $fileName,
        'download_link' => $directDownloadLink
    ]);
    
} catch (Google_Service_Exception $e) {
    error_log("Google Drive API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Google Drive API error: ' . $e->getMessage()
    ]);
} catch (PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

/**
 * Get or refresh Google Drive access token
 */
function getAccessToken($client) {
    $tokenPath = __DIR__ . '/token.json';
    
    // Load existing token if available
    if (file_exists($tokenPath)) {
        $accessToken = json_decode(file_get_contents($tokenPath), true);
        $client->setAccessToken($accessToken);
    }
    
    // If token is expired, refresh it
    if ($client->isAccessTokenExpired()) {
        if ($client->getRefreshToken()) {
            $client->fetchAccessTokenWithRefreshToken($client->getRefreshToken());
        } else {
            // Need to get new token - redirect to auth URL
            $authUrl = $client->createAuthUrl();
            throw new Exception('Authorization required. Please visit: ' . $authUrl);
        }
        
        // Save token for future use
        if (!file_exists(dirname($tokenPath))) {
            mkdir(dirname($tokenPath), 0700, true);
        }
        file_put_contents($tokenPath, json_encode($client->getAccessToken()));
    }
    
    return $client->getAccessToken();
}

?>

