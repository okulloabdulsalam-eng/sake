<?php
/**
 * Delete media file from Google Drive and database
 */

require_once __DIR__ . '/library_media_config.php';
require_once __DIR__ . '/../media-storage/vendor/autoload.php';

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
    
    // Delete from Google Drive
    try {
        $client = new Google_Client();
        $client->setAuthConfig(GOOGLE_CREDENTIALS_PATH);
        $client->addScope(Google_Service_Drive::DRIVE_FILE);
        $client->setAccessType('offline');
        
        $tokenPath = __DIR__ . '/../media-storage/token.json';
        if (file_exists($tokenPath)) {
            $accessToken = json_decode(file_get_contents($tokenPath), true);
            $client->setAccessToken($accessToken);
        }
        
        if ($client->isAccessTokenExpired()) {
            if ($client->getRefreshToken()) {
                $client->fetchAccessTokenWithRefreshToken($client->getRefreshToken());
                file_put_contents($tokenPath, json_encode($client->getAccessToken()));
            }
        }
        
        $driveService = new Google_Service_Drive($client);
        $driveService->files->delete($media['drive_file_id']);
    } catch (Exception $e) {
        error_log("Error deleting from Google Drive: " . $e->getMessage());
    }
    
    // Delete from database
    $stmt = $pdo->prepare("DELETE FROM media_files WHERE id = :id");
    $stmt->execute([':id' => $mediaId]);
    
    echo json_encode(['success' => true, 'message' => 'Media deleted successfully']);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
}

?>

