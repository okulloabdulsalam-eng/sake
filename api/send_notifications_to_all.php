<?php
/**
 * Send notifications to all users via Email
 * POST: subject, message, notification_id (optional)
 * 
 * This endpoint:
 * 1. Gets all users from database
 * 2. Sends Email notifications to users with emails
 * 3. Updates notification record with sent status
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
    
    $subject = $_POST['subject'] ?? '';
    $message = $_POST['message'] ?? '';
    $notificationId = $_POST['notification_id'] ?? null;
    
    if (empty($subject) || empty($message)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Subject and message are required'
        ]);
        exit;
    }
    
    // Get all users from database (MySQL)
    // Note: To include SQLite users too, use get_all_users_combined.php endpoint
    $stmt = $pdo->query("
        SELECT id, email, firstName, lastName, name 
        FROM users 
        WHERE email IS NOT NULL AND email != ''
    ");
    $users = $stmt->fetchAll();
    
    // Also try to get users from SQLite database (Node.js registration)
    $sqlitePath = __DIR__ . '/../kiuma_users.db';
    if (file_exists($sqlitePath)) {
        try {
            $sqlite = new PDO('sqlite:' . $sqlitePath);
            $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            $sqliteStmt = $sqlite->query("
                SELECT id, email, firstName, lastName, name
                FROM users 
                WHERE email IS NOT NULL AND email != ''
            ");
            $sqliteUsers = $sqliteStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Merge SQLite users, avoiding duplicates by email
            $existingEmails = array_column($users, 'email');
            foreach ($sqliteUsers as $sqliteUser) {
                if (!in_array($sqliteUser['email'] ?? '', $existingEmails)) {
                    $users[] = $sqliteUser;
                }
            }
        } catch (Exception $e) {
            // SQLite not available, continue with MySQL only
            error_log("SQLite users not accessible: " . $e->getMessage());
        }
    }
    
    $emailSent = 0;
    $emailFailed = 0;
    $results = [];
    
    // Send notifications to each user
    foreach ($users as $user) {
        $result = [
            'userId' => $user['id'],
            'name' => $user['name'] ?? ($user['firstName'] . ' ' . $user['lastName']),
            'email' => 'not sent'
        ];
        
        // Send Email if available
        if (!empty($user['email'])) {
            // TODO: Integrate with actual Email API (SMTP/SendGrid/Mailgun)
            // For now, we'll prepare the data and log it
            
            // In production, call Email API here:
            // $emailSuccess = sendEmailViaAPI($user['email'], $subject, $message);
            
            // For now, mark as prepared (not actually sent)
            $result['email'] = 'prepared';
            $emailSent++;
            
            // Log for manual sending or queue processing
            error_log("Email notification prepared for {$user['email']}: {$subject}");
        }
        
        $results[] = $result;
    }
    
    // Update notification record if notification_id provided
    if ($notificationId) {
        $updateStmt = $pdo->prepare("
            UPDATE notifications 
            SET sent_to_email = TRUE, 
                sent_date = NOW() 
            WHERE id = ?
        ");
        $updateStmt->execute([$notificationId]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Notifications processed',
        'totalUsers' => count($users),
        'emailSent' => $emailSent,
        'emailFailed' => $emailFailed,
        'results' => $results,
        'note' => 'Email notifications are prepared. Integrate Email API (SMTP/SendGrid/Mailgun) for actual sending.'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

?>

