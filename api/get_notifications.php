<?php
/**
 * Get all notifications from database
 * Sorted by: Unread first, then by date (newest first)
 */

require_once __DIR__ . '/library_media_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $pdo = getDBConnection();
    $status = $_GET['status'] ?? null;
    
    // Build SQL query with sorting
    // Sort: 1. Unread first (status = 'unread'), 2. Then by date (newest first)
    $sql = "SELECT * FROM notifications";
    $params = [];
    
    if ($status && $status !== 'all') {
        $sql .= " WHERE type = :status";
        $params[':status'] = $status;
    }
    
    // Sort: unread first, then by date (newest first)
    $sql .= " ORDER BY 
        CASE WHEN is_read = 0 THEN 0 ELSE 1 END,
        created_date DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $notifications = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'notifications' => $notifications,
        'total' => count($notifications)
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

?>

