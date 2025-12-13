<?php
/**
 * Sync Users from SQLite to MySQL Database
 * This will copy all users from SQLite (Node.js registration) to MySQL (PHP system)
 * so they can receive notifications
 */

require_once __DIR__ . '/api/library_media_config.php';

header('Content-Type: text/html; charset=utf-8');

$dbPath = __DIR__ . '/kiuma_users.db';
$sync = isset($_GET['sync']) && $_GET['sync'] === 'yes';

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Sync Databases</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1000px;
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
        .error {
            color: #e74c3c;
            padding: 10px;
            background: #fadbd8;
            border-left: 4px solid #e74c3c;
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
            padding: 10px;
            text-align: left;
        }
        th {
            background: #3498db;
            color: white;
        }
        .btn {
            padding: 12px 24px;
            background: #27ae60;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            margin: 10px 5px;
        }
        .btn:hover {
            background: #229954;
        }
        .btn-danger {
            background: #e74c3c;
        }
        .btn-danger:hover {
            background: #c0392b;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 Sync Users: SQLite → MySQL</h1>
        
        <?php
        if (!file_exists($dbPath)) {
            echo "<div class='error'>❌ SQLite database file not found: kiuma_users.db</div>";
            exit;
        }
        
        try {
            // Connect to SQLite
            $sqlite = new PDO('sqlite:' . $dbPath);
            $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Connect to MySQL
            $mysql = getDBConnection();
            
            // Get users from SQLite
            $stmt = $sqlite->query("SELECT * FROM users");
            $sqliteUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo "<div class='info'>";
            echo "<strong>SQLite Database:</strong> kiuma_users.db<br>";
            echo "<strong>MySQL Database:</strong> " . DB_NAME . "<br>";
            echo "<strong>Users in SQLite:</strong> " . count($sqliteUsers) . "<br>";
            echo "</div>";
            
            if (empty($sqliteUsers)) {
                echo "<div class='warning'>⚠️ No users found in SQLite database to sync.</div>";
                exit;
            }
            
            if (!$sync) {
                // Show preview
                echo "<h2>Preview: Users to Sync</h2>";
                echo "<table>";
                echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>WhatsApp</th><th>Status</th></tr>";
                
                foreach ($sqliteUsers as $user) {
                    // Check if user already exists in MySQL
                    $checkStmt = $mysql->prepare("SELECT id FROM users WHERE email = ?");
                    $checkStmt->execute([$user['email'] ?? '']);
                    $exists = $checkStmt->fetch();
                    
                    $name = trim(($user['firstName'] ?? '') . ' ' . ($user['lastName'] ?? ''));
                    if (empty($name)) $name = $user['name'] ?? 'N/A';
                    
                    echo "<tr>";
                    echo "<td>" . htmlspecialchars($user['id']) . "</td>";
                    echo "<td>" . htmlspecialchars($name) . "</td>";
                    echo "<td>" . htmlspecialchars($user['email'] ?? 'N/A') . "</td>";
                    echo "<td>" . htmlspecialchars($user['whatsapp'] ?? 'N/A') . "</td>";
                    echo "<td>" . ($exists ? '⚠️ Already exists' : '✅ New') . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
                
                echo "<div class='warning'>";
                echo "⚠️ <strong>Important:</strong><br>";
                echo "• This will copy users from SQLite to MySQL<br>";
                echo "• Users with existing emails will be skipped (to avoid duplicates)<br>";
                echo "• Passwords will NOT be copied (for security - users need to register again or reset password)<br>";
                echo "• WhatsApp numbers WILL be copied if available<br>";
                echo "</div>";
                
                echo "<a href='?sync=yes' class='btn btn-danger'>🔄 Start Sync</a>";
                echo "<a href='view_all_sqlite_users.php' class='btn' style='background:#3498db;'>← Back</a>";
                
            } else {
                // Perform sync
                echo "<h2>Syncing Users...</h2>";
                
                $synced = 0;
                $skipped = 0;
                $errors = 0;
                $results = [];
                
                foreach ($sqliteUsers as $user) {
                    try {
                        // Check if user already exists
                        $checkStmt = $mysql->prepare("SELECT id FROM users WHERE email = ?");
                        $checkStmt->execute([$user['email'] ?? '']);
                        $exists = $checkStmt->fetch();
                        
                        if ($exists) {
                            // Update existing user (add WhatsApp if missing)
                            if (!empty($user['whatsapp'])) {
                                $updateStmt = $mysql->prepare("
                                    UPDATE users 
                                    SET whatsapp = ?, 
                                        firstName = COALESCE(firstName, ?), 
                                        lastName = COALESCE(lastName, ?),
                                        name = COALESCE(name, ?),
                                        gender = COALESCE(gender, ?)
                                    WHERE email = ?
                                ");
                                $updateStmt->execute([
                                    $user['whatsapp'],
                                    $user['firstName'] ?? null,
                                    $user['lastName'] ?? null,
                                    $user['name'] ?? null,
                                    $user['gender'] ?? null,
                                    $user['email']
                                ]);
                                $results[] = ['email' => $user['email'], 'action' => 'updated', 'whatsapp' => $user['whatsapp']];
                            } else {
                                $results[] = ['email' => $user['email'], 'action' => 'skipped (exists, no whatsapp)'];
                            }
                            $skipped++;
                        } else {
                            // Insert new user (without password - they'll need to reset)
                            $name = trim(($user['firstName'] ?? '') . ' ' . ($user['lastName'] ?? ''));
                            if (empty($name)) $name = $user['name'] ?? null;
                            
                            $insertStmt = $mysql->prepare("
                                INSERT INTO users (email, firstName, lastName, name, whatsapp, gender, createdAt) 
                                VALUES (?, ?, ?, ?, ?, ?, ?)
                            ");
                            
                            $createdAt = $user['createdAt'] ?? date('Y-m-d H:i:s');
                            
                            $insertStmt->execute([
                                $user['email'] ?? null,
                                $user['firstName'] ?? null,
                                $user['lastName'] ?? null,
                                $name,
                                $user['whatsapp'] ?? null,
                                $user['gender'] ?? null,
                                $createdAt
                            ]);
                            
                            $synced++;
                            $results[] = ['email' => $user['email'], 'action' => 'synced', 'id' => $mysql->lastInsertId()];
                        }
                    } catch (Exception $e) {
                        $errors++;
                        $results[] = ['email' => $user['email'] ?? 'N/A', 'action' => 'error', 'error' => $e->getMessage()];
                        echo "<div class='error'>Error syncing user " . htmlspecialchars($user['email'] ?? 'N/A') . ": " . htmlspecialchars($e->getMessage()) . "</div>";
                    }
                }
                
                // Show results
                echo "<div class='success'>✅ Sync Complete!</div>";
                echo "<div class='info'>";
                echo "<strong>Synced:</strong> $synced new user(s)<br>";
                echo "<strong>Skipped/Updated:</strong> $skipped user(s)<br>";
                echo "<strong>Errors:</strong> $errors<br>";
                echo "</div>";
                
                echo "<h3>Sync Results</h3>";
                echo "<table>";
                echo "<tr><th>Email</th><th>Action</th><th>Details</th></tr>";
                foreach ($results as $result) {
                    echo "<tr>";
                    echo "<td>" . htmlspecialchars($result['email']) . "</td>";
                    echo "<td>" . htmlspecialchars($result['action']) . "</td>";
                    echo "<td>";
                    if (isset($result['id'])) {
                        echo "MySQL ID: " . $result['id'];
                    } elseif (isset($result['whatsapp'])) {
                        echo "WhatsApp: " . htmlspecialchars($result['whatsapp']);
                    } elseif (isset($result['error'])) {
                        echo "<span style='color:red;'>" . htmlspecialchars($result['error']) . "</span>";
                    }
                    echo "</td>";
                    echo "</tr>";
                }
                echo "</table>";
                
                echo "<div class='success' style='margin-top:20px;'>";
                echo "✅ Users are now in MySQL database and can receive notifications!<br>";
                echo "<a href='test_send_whatsapp_notifications.php' class='btn'>📤 Test WhatsApp Notifications</a>";
                echo "</div>";
            }
            
        } catch (Exception $e) {
            echo "<div class='error'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</div>";
            echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
        }
        ?>
        
        <hr>
        <a href="view_all_sqlite_users.php" class="btn" style="background:#3498db;">← Back</a>
    </div>
</body>
</html>

