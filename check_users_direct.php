<?php
/**
 * Direct Check of Users in Database
 */

require_once __DIR__ . '/api/library_media_config.php';

header('Content-Type: text/html; charset=utf-8');

try {
    $pdo = getDBConnection();
    
    // Count all users
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM users");
    $total = $stmt->fetch()['total'];
    
    // Get all users
    $stmt = $pdo->query("SELECT id, email, firstName, lastName, name, whatsapp, gender, createdAt FROM users ORDER BY createdAt DESC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<!DOCTYPE html><html><head><title>Users in Database</title>";
    echo "<style>body{font-family:Arial;padding:20px;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ddd;padding:8px;} th{background:#3498db;color:white;}</style>";
    echo "</head><body>";
    echo "<h1>Users in Database: $total</h1>";
    
    if ($total > 0) {
        echo "<table>";
        echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>WhatsApp</th><th>Gender</th><th>Registered</th></tr>";
        foreach ($users as $user) {
            $name = trim(($user['firstName'] ?? '') . ' ' . ($user['lastName'] ?? ''));
            if (empty($name)) $name = $user['name'] ?? 'N/A';
            
            echo "<tr>";
            echo "<td>" . htmlspecialchars($user['id']) . "</td>";
            echo "<td>" . htmlspecialchars($name) . "</td>";
            echo "<td>" . htmlspecialchars($user['email'] ?? 'N/A') . "</td>";
            echo "<td>" . htmlspecialchars($user['whatsapp'] ?? 'N/A') . "</td>";
            echo "<td>" . htmlspecialchars($user['gender'] ?? 'N/A') . "</td>";
            echo "<td>" . htmlspecialchars($user['createdAt'] ?? 'N/A') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p style='color:orange;'><strong>No users found in MySQL database!</strong></p>";
        echo "<p>This could mean:</p>";
        echo "<ul>";
        echo "<li>Users are registering via Node.js (using SQLite database: kiuma_users.db)</li>";
        echo "<li>Registration is not working</li>";
        echo "<li>No one has registered yet</li>";
        echo "</ul>";
    }
    
    echo "</body></html>";
    
} catch (Exception $e) {
    echo "Error: " . htmlspecialchars($e->getMessage());
}

