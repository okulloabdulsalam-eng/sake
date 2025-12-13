<?php
/**
 * View All Users from SQLite Database (Node.js Registration)
 * Shows detailed information about all registered users
 */

header('Content-Type: text/html; charset=utf-8');

$dbPath = __DIR__ . '/kiuma_users.db';

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>All SQLite Users</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        .success {
            color: #27ae60;
            padding: 10px;
            background: #d5f4e6;
            border-left: 4px solid #27ae60;
            margin: 10px 0;
        }
        .info {
            color: #3498db;
            padding: 10px;
            background: #ebf5fb;
            border-left: 4px solid #3498db;
            margin: 10px 0;
        }
        .warning {
            color: #f39c12;
            padding: 10px;
            background: #fef5e7;
            border-left: 4px solid #f39c12;
            margin: 10px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background: #3498db;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background: #f9f9f9;
        }
        .user-detail {
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
            border-left: 4px solid #3498db;
        }
        .btn {
            padding: 10px 20px;
            background: #27ae60;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 5px;
        }
        .btn:hover {
            background: #229954;
        }
        .btn-secondary {
            background: #3498db;
        }
        .btn-secondary:hover {
            background: #2980b9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>👥 All Registered Users (SQLite Database)</h1>
        
        <?php
        if (!file_exists($dbPath)) {
            echo "<div class='warning'>❌ SQLite database file not found: kiuma_users.db</div>";
            exit;
        }
        
        try {
            $db = new PDO('sqlite:' . $dbPath);
            $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Get table structure first
            $stmt = $db->query("PRAGMA table_info(users)");
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $columnNames = array_column($columns, 'name');
            
            echo "<div class='info'>";
            echo "<strong>Database:</strong> kiuma_users.db<br>";
            echo "<strong>Table:</strong> users<br>";
            echo "<strong>Columns:</strong> " . implode(', ', $columnNames) . "<br>";
            echo "<strong>File Size:</strong> " . number_format(filesize($dbPath)) . " bytes<br>";
            echo "<strong>Last Modified:</strong> " . date('Y-m-d H:i:s', filemtime($dbPath)) . "<br>";
            echo "</div>";
            
            // Count users
            $stmt = $db->query("SELECT COUNT(*) as total FROM users");
            $total = $stmt->fetch()['total'];
            
            echo "<div class='success'>✅ Found $total registered user(s)</div>";
            
            if ($total > 0) {
                // Get all users with all available columns
                $query = "SELECT * FROM users ORDER BY createdAt DESC";
                $stmt = $db->query($query);
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Summary table
                echo "<h2>Users Summary</h2>";
                echo "<table>";
                echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>WhatsApp</th><th>Gender</th><th>Registered</th></tr>";
                
                foreach ($users as $user) {
                    $name = '';
                    if (!empty($user['firstName']) || !empty($user['lastName'])) {
                        $name = trim(($user['firstName'] ?? '') . ' ' . ($user['lastName'] ?? ''));
                    }
                    if (empty($name) && !empty($user['name'])) {
                        $name = $user['name'];
                    }
                    if (empty($name)) {
                        $name = 'N/A';
                    }
                    
                    echo "<tr>";
                    echo "<td>" . htmlspecialchars($user['id']) . "</td>";
                    echo "<td>" . htmlspecialchars($name) . "</td>";
                    echo "<td>" . htmlspecialchars($user['email'] ?? 'N/A') . "</td>";
                    echo "<td>" . htmlspecialchars($user['whatsapp'] ?? (in_array('whatsapp', $columnNames) ? 'Not provided' : 'N/A')) . "</td>";
                    echo "<td>" . htmlspecialchars($user['gender'] ?? 'N/A') . "</td>";
                    echo "<td>" . htmlspecialchars($user['createdAt'] ?? 'N/A') . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
                
                // Detailed view for each user
                echo "<h2>Detailed User Information</h2>";
                foreach ($users as $index => $user) {
                    $name = '';
                    if (!empty($user['firstName']) || !empty($user['lastName'])) {
                        $name = trim(($user['firstName'] ?? '') . ' ' . ($user['lastName'] ?? ''));
                    }
                    if (empty($name) && !empty($user['name'])) {
                        $name = $user['name'];
                    }
                    
                    echo "<div class='user-detail'>";
                    echo "<h3>User #" . ($index + 1) . ": " . htmlspecialchars($name ?: 'Unnamed User') . "</h3>";
                    echo "<table>";
                    
                    foreach ($columnNames as $colName) {
                        $value = $user[$colName] ?? 'NULL';
                        if ($colName === 'password') {
                            $value = '***HIDDEN*** (' . strlen($user[$colName] ?? '') . ' characters)';
                        }
                        
                        echo "<tr>";
                        echo "<td><strong>" . htmlspecialchars(ucfirst($colName)) . "</strong></td>";
                        echo "<td>" . htmlspecialchars($value) . "</td>";
                        echo "</tr>";
                    }
                    
                    echo "</table>";
                    echo "</div>";
                }
                
                // Statistics
                echo "<h2>Statistics</h2>";
                $withWhatsApp = 0;
                $withEmail = 0;
                $withGender = 0;
                
                foreach ($users as $user) {
                    if (!empty($user['email'])) $withEmail++;
                    if (!empty($user['whatsapp']) || (in_array('whatsapp', $columnNames) && !empty($user['whatsapp']))) $withWhatsApp++;
                    if (!empty($user['gender'])) $withGender++;
                }
                
                echo "<div class='info'>";
                echo "<strong>Users with Email:</strong> $withEmail / $total<br>";
                echo "<strong>Users with WhatsApp:</strong> $withWhatsApp / $total<br>";
                echo "<strong>Users with Gender:</strong> $withGender / $total<br>";
                echo "</div>";
                
            } else {
                echo "<div class='warning'>No users found in database.</div>";
            }
            
        } catch (Exception $e) {
            echo "<div class='error'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</div>";
            echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
        }
        ?>
        
        <hr>
        <div style="margin-top: 20px;">
            <a href="sync_databases.php" class="btn btn-secondary">🔄 Sync to MySQL Database</a>
            <a href="check_registration_database.php" class="btn">← Back to Database Check</a>
        </div>
    </div>
</body>
</html>

