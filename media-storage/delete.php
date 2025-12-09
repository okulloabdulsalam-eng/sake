<?php
/**
 * Delete Media File from Google Drive and Database
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/vendor/autoload.php';

session_start();

// Check if user is logged in as admin
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: dashboard.php');
    exit;
}

// Get file ID from URL
$fileId = $_GET['id'] ?? null;

if (!$fileId) {
    header('Location: dashboard.php?error=No file ID provided');
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Get file information from database
    $stmt = $pdo->prepare("SELECT * FROM media_storage WHERE id = :id");
    $stmt->execute([':id' => $fileId]);
    $file = $stmt->fetch();
    
    if (!$file) {
        header('Location: dashboard.php?error=File not found');
        exit;
    }
    
    // Delete from Google Drive
    try {
        $client = new Google_Client();
        $client->setAuthConfig(GOOGLE_CREDENTIALS_PATH);
        $client->addScope(Google_Service_Drive::DRIVE_FILE);
        $client->setAccessType('offline');
        
        // Get access token
        $tokenPath = __DIR__ . '/token.json';
        if (file_exists($tokenPath)) {
            $accessToken = json_decode(file_get_contents($tokenPath), true);
            $client->setAccessToken($accessToken);
        }
        
        // Refresh token if expired
        if ($client->isAccessTokenExpired()) {
            if ($client->getRefreshToken()) {
                $client->fetchAccessTokenWithRefreshToken($client->getRefreshToken());
                file_put_contents($tokenPath, json_encode($client->getAccessToken()));
            }
        }
        
        $driveService = new Google_Service_Drive($client);
        $driveService->files->delete($file['drive_file_id']);
        
    } catch (Exception $e) {
        error_log("Error deleting from Google Drive: " . $e->getMessage());
        // Continue to delete from database even if Drive deletion fails
    }
    
    // Delete from database
    $stmt = $pdo->prepare("DELETE FROM media_storage WHERE id = :id");
    $stmt->execute([':id' => $fileId]);
    
    // Redirect to dashboard with success message
    header('Location: dashboard.php?deleted=1');
    exit;
    
} catch (PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    header('Location: dashboard.php?error=Database error: ' . urlencode($e->getMessage()));
    exit;
} catch (Exception $e) {
    error_log("General Error: " . $e->getMessage());
    header('Location: dashboard.php?error=' . urlencode($e->getMessage()));
    exit;
}

?>

