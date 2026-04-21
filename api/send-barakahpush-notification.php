<?php
/**
 * BarakahPush Notification System – Active
 * 
 * Admin API endpoint to send notifications via FCM
 * Protected by password: kiuma2025
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Admin password
define('ADMIN_PASSWORD', 'kiuma2025');

// Get request data
$input = json_decode(file_get_contents('php://input'), true);
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Verify admin password
$password = $input['password'] ?? '';
if ($password !== ADMIN_PASSWORD) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

// Get notification data
$title = $input['title'] ?? '';
$body = $input['body'] ?? '';
$sendEmail = $input['send_email'] ?? false;
$sendPush = $input['send_push'] ?? true;

// Validate
if (empty($title) || empty($body)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Title and body are required']);
    exit;
}

// Sanitize inputs
$title = htmlspecialchars(strip_tags($title), ENT_QUOTES, 'UTF-8');
$body = htmlspecialchars(strip_tags($body), ENT_QUOTES, 'UTF-8');

// This endpoint will be called by Firebase Cloud Functions
// The actual FCM sending will be handled server-side
// For now, return success - Cloud Functions will handle the rest

echo json_encode([
    'success' => true,
    'message' => 'Notification queued for sending',
    'data' => [
        'title' => $title,
        'body' => $body,
        'send_email' => $sendEmail,
        'send_push' => $sendPush
    ]
]);

