<?php
/**
 * Proxy Download Endpoint for Media Files
 * Streams files directly from Google Drive without redirecting users
 */

require_once __DIR__ . '/library_media_config.php';
require_once __DIR__ . '/../media-storage/vendor/autoload.php';

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
    
    // Initialize Google Drive API Client
    $client = new Google_Client();
    $client->setAuthConfig(GOOGLE_CREDENTIALS_PATH);
    $client->addScope(Google_Service_Drive::DRIVE_READONLY);
    $client->setAccessType('offline');
    
    $accessToken = getAccessToken($client);
    $client->setAccessToken($accessToken);
    
    $driveService = new Google_Service_Drive($client);
    
    // Get file metadata first
    $fileMetadata = $driveService->files->get($media['drive_file_id']);
    
    // Get file content
    $request = $driveService->files->get($media['drive_file_id'], ['alt' => 'media']);
    $fileContent = $request->getBody()->getContents();
    
    // Set headers for download
    $fileName = $media['file_name'];
    $mimeType = $media['mime_type'] ?: $fileMetadata->getMimeType();
    $fileSize = $media['file_size'] ?: strlen($fileContent);
    
    header('Content-Type: ' . $mimeType);
    header('Content-Disposition: attachment; filename="' . addslashes($fileName) . '"');
    header('Content-Length: ' . $fileSize);
    header('Cache-Control: public, max-age=3600');
    
    // Stream file content directly to user
    echo $fileContent;
    
} catch (Google_Service_Exception $e) {
    error_log("Google Drive API Error: " . $e->getMessage());
    http_response_code(500);
    die('Error downloading file from Google Drive');
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

