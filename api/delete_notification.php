<?php
/**
 * Delete notification from database
 * POST: notification_id, admin_password
 */

require_once __DIR__ . '/library_media_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Check admin authentication
$adminPassword = $_POST['admin_password'] ?? $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
if ($adminPassword !== ADMIN_PASSWORD) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Admin password required.']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    $notificationId = $_POST['notification_id'] ?? '';
    
    if (empty($notificationId)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Notification ID is required'
        ]);
        exit;
    }
    
    // Delete notification from database
    $stmt = $pdo->prepare("DELETE FROM notifications WHERE id = ?");
    $stmt->execute([$notificationId]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Notification deleted successfully'
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Notification not found'
        ]);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

?>

