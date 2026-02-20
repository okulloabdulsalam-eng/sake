<?php
/**
 * Check SQLite Database for Users (Node.js Registration)
 */

header('Content-Type: text/html; charset=utf-8');

$dbPath = __DIR__ . '/kiuma_users.db';

echo "<!DOCTYPE html><html><head><title>SQLite Users Check</title>";
echo "<style>body{font-family:Arial;padding:20px;background:#f5f5f5;}";
echo ".container{max-width:800px;margin:0 auto;background:white;padding:30px;border-radius:10px;}";
echo "table{border-collapse:collapse;width:100%;margin:15px 0;}";
echo "th,td{border:1px solid #ddd;padding:8px;}";
echo "th{background:#3498db;color:white;}";
echo ".success{color:#27ae60;padding:10px;background:#d5f4e6;border-left:4px solid #27ae60;margin:10px 0;}";
echo ".error{color:#e74c3c;padding:10px;background:#fadbd8;border-left:4px solid #e74c3c;margin:10px 0;}";
echo ".info{color:#3498db;padding:10px;background:#ebf5fb;border-left:4px solid #3498db;margin:10px 0;}";
echo "</style></head><body><div class='container'>";
echo "<h1>🔍 Check SQLite Database (Node.js Registration)</h1>";

if (!file_exists($dbPath)) {
    echo "<div class='error'>❌ SQLite database file not found: kiuma_users.db</div>";
    echo "<div class='info'>This means Node.js registration is not being used, OR the Node.js server hasn't been started yet (it creates the database on first run).</div>";
} else {
    echo "<div class='success'>✅ SQLite database file exists: kiuma_users.db</div>";
    echo "<div class='info'>File size: " . number_format(filesize($dbPath)) . " bytes</div>";
    echo "<div class='info'>Last modified: " . date('Y-m-d H:i:s', filemtime($dbPath)) . "</div>";
    
    try {
        $db = new PDO('sqlite:' . $dbPath);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Check if users table exists
        $stmt = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
        $tableExists = $stmt->fetch();
        
        if (!$tableExists) {
            echo "<div class='error'>❌ Users table does not exist in SQLite database</div>";
        } else {
            echo "<div class='success'>✅ Users table exists</div>";
            
            // Count users
            $stmt = $db->query("SELECT COUNT(*) as total FROM users");
            $total = $stmt->fetch()['total'];
            
            echo "<h2>Users in SQLite Database: $total</h2>";
            
            if ($total > 0) {
                // First check what columns exist
                $stmt = $db->query("PRAGMA table_info(users)");
                $columns = $stmt->fetchAll(PDO::FETCH_COLUMN, 1);
                $hasWhatsApp = in_array('whatsapp', $columns);
                
                // Build query based on available columns
                $selectColumns = ['id', 'email', 'firstName', 'lastName', 'name', 'gender', 'createdAt'];
                if ($hasWhatsApp) {
                    $selectColumns[] = 'whatsapp';
                }
                
                // Get all users
                $query = "SELECT " . implode(', ', $selectColumns) . " FROM users ORDER BY createdAt DESC";
                $stmt = $db->query($query);
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo "<table>";
                $header = "<tr><th>ID</th><th>Name</th><th>Email</th>";
                if ($hasWhatsApp) {
                    $header .= "<th>WhatsApp</th>";
                }
                $header .= "<th>Gender</th><th>Registered</th></tr>";
                echo $header;
                
                foreach ($users as $user) {
                    $name = trim(($user['firstName'] ?? '') . ' ' . ($user['lastName'] ?? ''));
                    if (empty($name)) $name = $user['name'] ?? 'N/A';
                    
                    echo "<tr>";
                    echo "<td>" . htmlspecialchars($user['id']) . "</td>";
                    echo "<td>" . htmlspecialchars($name) . "</td>";
                    echo "<td>" . htmlspecialchars($user['email'] ?? 'N/A') . "</td>";
                    if ($hasWhatsApp) {
                        echo "<td>" . htmlspecialchars($user['whatsapp'] ?? 'N/A') . "</td>";
                    }
                    echo "<td>" . htmlspecialchars($user['gender'] ?? 'N/A') . "</td>";
                    echo "<td>" . htmlspecialchars($user['createdAt'] ?? 'N/A') . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
                
                echo "<div class='success' style='margin-top:20px;'>";
                echo "✅ <strong>FOUND $total USER(S)!</strong><br>";
                echo "Users are being saved to SQLite database (Node.js registration system).";
                echo "</div>";
            } else {
                echo "<div class='info'>No users found in SQLite database yet.</div>";
            }
        }
        
    } catch (Exception $e) {
        echo "<div class='error'>❌ Error reading SQLite database: " . htmlspecialchars($e->getMessage()) . "</div>";
    }
}

echo "<hr>";
echo "<h2>Summary</h2>";
echo "<div class='info'>";
echo "<strong>Two Registration Systems:</strong><br><br>";
echo "1. <strong>Node.js (server.js)</strong> → SQLite database (kiuma_users.db)<br>";
echo "   - Port: 3000<br>";
echo "   - API: POST http://localhost:3000/register<br><br>";
echo "2. <strong>PHP API</strong> → MySQL database (kiuma_main)<br>";
echo "   - Uses existing web server<br>";
echo "   - API: POST /api/register.php (if exists)<br><br>";
echo "<strong>Check which one is being used by looking at the frontend JavaScript API_BASE_URL configuration.</strong>";
echo "</div>";

echo "</div></body></html>";

