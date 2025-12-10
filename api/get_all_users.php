<?php
/**
 * Get all users from database (for sending notifications)
 * Returns: id, email, whatsapp, firstName, lastName, name, gender
 * Excludes: password
 */

require_once __DIR__ . '/library_media_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $pdo = getDBConnection();
    
    // Get all users (excluding password)
    $stmt = $pdo->query("
        SELECT 
            id, 
            email, 
            whatsapp, 
            firstName, 
            lastName, 
            name, 
            gender,
            createdAt
        FROM users 
        ORDER BY createdAt DESC
    ");
    
    $users = $stmt->fetchAll();
    
    // Format users for frontend
    $formattedUsers = array_map(function($user) {
        return [
            'id' => $user['id'],
            'email' => $user['email'] ?? '',
            'whatsapp' => $user['whatsapp'] ?? '',
            'firstName' => $user['firstName'] ?? '',
            'lastName' => $user['lastName'] ?? '',
            'name' => $user['name'] ?? ($user['firstName'] . ' ' . $user['lastName']),
            'gender' => $user['gender'] ?? '',
            'createdAt' => $user['createdAt'] ?? ''
        ];
    }, $users);
    
    echo json_encode([
        'success' => true,
        'users' => $formattedUsers,
        'total' => count($formattedUsers)
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

?>

