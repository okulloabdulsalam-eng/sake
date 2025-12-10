<?php
/**
 * Save notification to database
 * POST: title, message, type, target_audience, icon (optional)
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

// Check admin authentication (simple password check)
$adminPassword = $_POST['admin_password'] ?? $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
if ($adminPassword !== ADMIN_PASSWORD) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Admin password required.']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Get data from POST
    $title = $_POST['title'] ?? '';
    $message = $_POST['message'] ?? '';
    $type = $_POST['type'] ?? 'info';
    $targetAudience = $_POST['target_audience'] ?? 'all';
    $icon = $_POST['icon'] ?? 'fas fa-bell';
    
    // Validate required fields
    if (empty($title) || empty($message)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Title and message are required'
        ]);
        exit;
    }
    
    // Validate type
    $allowedTypes = ['info', 'reminder', 'announcement', 'white_days', 'fasting'];
    if (!in_array($type, $allowedTypes)) {
        $type = 'info';
    }
    
    // Validate target_audience
    $allowedAudiences = ['all', 'male', 'female', 'specific'];
    if (!in_array($targetAudience, $allowedAudiences)) {
        $targetAudience = 'all';
    }
    
    // Insert notification into database
    $stmt = $pdo->prepare("
        INSERT INTO notifications (title, message, type, target_audience, sent_to_whatsapp, sent_to_email, created_date, is_read)
        VALUES (?, ?, ?, ?, FALSE, FALSE, NOW(), FALSE)
    ");
    
    $stmt->execute([$title, $message, $type, $targetAudience]);
    
    $notificationId = $pdo->lastInsertId();
    
    // Get the created notification
    $stmt = $pdo->prepare("SELECT * FROM notifications WHERE id = ?");
    $stmt->execute([$notificationId]);
    $notification = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'Notification saved successfully',
        'notification' => $notification
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

?>

