<?php
/**
 * Get all users from BOTH SQLite and MySQL databases
 * Combines users from both registration systems
 */

require_once __DIR__ . '/library_media_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$users = [];

try {
    // Get users from MySQL (PHP system)
    $mysql = getDBConnection();
    $stmt = $mysql->query("
        SELECT 
            id, 
            email, 
            whatsapp, 
            firstName, 
            lastName, 
            name, 
            gender,
            createdAt,
            'mysql' as source
        FROM users 
        WHERE (email IS NOT NULL AND email != '') OR (whatsapp IS NOT NULL AND whatsapp != '')
        ORDER BY createdAt DESC
    ");
    $mysqlUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Add MySQL users
    foreach ($mysqlUsers as $user) {
        $users[] = $user;
    }
    
    // Get users from SQLite (Node.js system)
    $sqlitePath = __DIR__ . '/../kiuma_users.db';
    if (file_exists($sqlitePath)) {
        try {
            $sqlite = new PDO('sqlite:' . $sqlitePath);
            $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Check if whatsapp column exists
            $pragmaStmt = $sqlite->query("PRAGMA table_info(users)");
            $columns = $pragmaStmt->fetchAll(PDO::FETCH_COLUMN, 1);
            $hasWhatsApp = in_array('whatsapp', $columns);
            
            $selectCols = ['id', 'email', 'firstName', 'lastName', 'name', 'gender', 'createdAt'];
            if ($hasWhatsApp) {
                $selectCols[] = 'whatsapp';
            }
            
            $stmt = $sqlite->query("
                SELECT " . implode(', ', $selectCols) . ", 'sqlite' as source
                FROM users 
                WHERE (email IS NOT NULL AND email != '') OR " . ($hasWhatsApp ? "(whatsapp IS NOT NULL AND whatsapp != '')" : "1=0") . "
                ORDER BY createdAt DESC
            ");
            $sqliteUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Merge SQLite users, avoiding duplicates by email
            $existingEmails = array_column($mysqlUsers, 'email');
            foreach ($sqliteUsers as $user) {
                // Only add if email doesn't already exist in MySQL users
                if (!in_array($user['email'] ?? '', $existingEmails)) {
                    // Ensure whatsapp is set if column doesn't exist
                    if (!isset($user['whatsapp'])) {
                        $user['whatsapp'] = null;
                    }
                    $users[] = $user;
                }
            }
            
        } catch (Exception $e) {
            // SQLite not available, continue with MySQL only
            error_log("SQLite database not accessible: " . $e->getMessage());
        }
    }
    
    // Format users
    $formattedUsers = array_map(function($user) {
        $name = $user['name'] ?? '';
        if (empty($name) && (!empty($user['firstName']) || !empty($user['lastName']))) {
            $name = trim(($user['firstName'] ?? '') . ' ' . ($user['lastName'] ?? ''));
        }
        
        return [
            'id' => $user['id'],
            'email' => $user['email'] ?? '',
            'whatsapp' => $user['whatsapp'] ?? '',
            'firstName' => $user['firstName'] ?? '',
            'lastName' => $user['lastName'] ?? '',
            'name' => $name,
            'gender' => $user['gender'] ?? '',
            'createdAt' => $user['createdAt'] ?? '',
            'source' => $user['source'] ?? 'unknown'
        ];
    }, $users);
    
    echo json_encode([
        'success' => true,
        'users' => $formattedUsers,
        'total' => count($formattedUsers),
        'sources' => [
            'mysql' => count(array_filter($users, fn($u) => ($u['source'] ?? '') === 'mysql')),
            'sqlite' => count(array_filter($users, fn($u) => ($u['source'] ?? '') === 'sqlite'))
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

?>

