<?php
/**
 * Delete book from Google Drive and database
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

$bookId = $_POST['id'] ?? $_GET['id'] ?? null;

if (!$bookId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Book ID required']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Get book info
    $stmt = $pdo->prepare("SELECT * FROM library_books WHERE id = :id");
    $stmt->execute([':id' => $bookId]);
    $book = $stmt->fetch();
    
    if (!$book) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Book not found']);
        exit;
    }
    
    // Delete from Google Drive if file exists
    if (!empty($book['drive_file_id'])) {
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
            $driveService->files->delete($book['drive_file_id']);
        } catch (Exception $e) {
            error_log("Error deleting from Google Drive: " . $e->getMessage());
            // Continue to delete from database
        }
    }
    
    // Delete from database
    $stmt = $pdo->prepare("DELETE FROM library_books WHERE id = :id");
    $stmt->execute([':id' => $bookId]);
    
    echo json_encode(['success' => true, 'message' => 'Book deleted successfully']);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
}

?>

