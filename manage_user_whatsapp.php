<?php
/**
 * Manage User WhatsApp Numbers
 * Add or update WhatsApp numbers for users who didn't provide them during registration
 */

require_once __DIR__ . '/api/library_media_config.php';

header('Content-Type: text/html; charset=utf-8');

$action = $_GET['action'] ?? 'list';
$userId = $_GET['user_id'] ?? null;
$update = isset($_POST['update_whatsapp']);

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Manage User WhatsApp Numbers</title>
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
        .btn {
            padding: 8px 16px;
            background: #27ae60;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            font-size: 14px;
        }
        .btn:hover {
            background: #229954;
        }
        .btn-edit {
            background: #3498db;
        }
        .btn-edit:hover {
            background: #2980b9;
        }
        .btn-danger {
            background: #e74c3c;
        }
        .btn-danger:hover {
            background: #c0392b;
        }
        .form-group {
            margin: 15px 0;
        }
        .form-label {
            display: block;
            font-weight: bold;
            margin-bottom: 5px;
            color: #34495e;
        }
        .form-input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
            max-width: 400px;
        }
        .form-input:focus {
            outline: none;
            border-color: #3498db;
            box-shadow: 0 0 5px rgba(52, 152, 219, 0.3);
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-box {
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
            text-align: center;
        }
        .stat-box .number {
            font-size: 32px;
            font-weight: bold;
            margin: 10px 0;
        }
        .badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        .badge-success {
            background: #d5f4e6;
            color: #27ae60;
        }
        .badge-warning {
            background: #fef5e7;
            color: #f39c12;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 Manage User WhatsApp Numbers</h1>
        
        <?php
        try {
            $pdo = getDBConnection();
            
            // Handle update
            if ($update && $userId) {
                $whatsapp = trim($_POST['whatsapp'] ?? '');
                
                // Validate WhatsApp number format
                if (!empty($whatsapp)) {
                    // Clean the number (remove spaces, dashes, etc.)
                    $cleanWhatsApp = preg_replace('/[^\d+]/', '', $whatsapp);
                    
                    // Ensure it starts with +
                    if (!str_starts_with($cleanWhatsApp, '+')) {
                        $cleanWhatsApp = '+' . $cleanWhatsApp;
                    }
                    
                    // Update in MySQL
                    $stmt = $pdo->prepare("UPDATE users SET whatsapp = ? WHERE id = ?");
                    $stmt->execute([$cleanWhatsApp, $userId]);
                    
                    echo "<div class='success'>✅ WhatsApp number updated successfully!</div>";
                    echo "<div class='info'>User ID: $userId<br>WhatsApp: $cleanWhatsApp</div>";
                    
                    // Also update in SQLite if user exists there
                    $sqlitePath = __DIR__ . '/kiuma_users.db';
                    if (file_exists($sqlitePath)) {
                        try {
                            $sqlite = new PDO('sqlite:' . $sqlitePath);
                            $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                            
                            // Check if whatsapp column exists
                            $pragmaStmt = $sqlite->query("PRAGMA table_info(users)");
                            $columns = $pragmaStmt->fetchAll(PDO::FETCH_COLUMN, 1);
                            
                            if (in_array('whatsapp', $columns)) {
                                // Get user email from MySQL to find in SQLite
                                $emailStmt = $pdo->prepare("SELECT email FROM users WHERE id = ?");
                                $emailStmt->execute([$userId]);
                                $email = $emailStmt->fetchColumn();
                                
                                if ($email) {
                                    $sqliteStmt = $sqlite->prepare("UPDATE users SET whatsapp = ? WHERE email = ?");
                                    $sqliteStmt->execute([$cleanWhatsApp, $email]);
                                    echo "<div class='info'>✅ Also updated in SQLite database</div>";
                                }
                            } else {
                                // Column doesn't exist, add it
                                $sqlite->exec("ALTER TABLE users ADD COLUMN whatsapp TEXT");
                                $emailStmt = $pdo->prepare("SELECT email FROM users WHERE id = ?");
                                $emailStmt->execute([$userId]);
                                $email = $emailStmt->fetchColumn();
                                
                                if ($email) {
                                    $sqliteStmt = $sqlite->prepare("UPDATE users SET whatsapp = ? WHERE email = ?");
                                    $sqliteStmt->execute([$cleanWhatsApp, $email]);
                                    echo "<div class='info'>✅ Added WhatsApp column to SQLite and updated</div>";
                                }
                            }
                        } catch (Exception $e) {
                            echo "<div class='warning'>⚠️ Could not update SQLite: " . htmlspecialchars($e->getMessage()) . "</div>";
                        }
                    }
                    
                    echo "<a href='?' class='btn'>← Back to List</a>";
                } else {
                    echo "<div class='error'>❌ WhatsApp number cannot be empty</div>";
                    echo "<a href='?action=edit&user_id=$userId' class='btn'>← Back</a>";
                }
                
            } elseif ($action === 'edit' && $userId) {
                // Edit form
                $stmt = $pdo->prepare("SELECT id, email, firstName, lastName, name, whatsapp FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$user) {
                    echo "<div class='error'>❌ User not found</div>";
                    echo "<a href='?' class='btn'>← Back to List</a>";
                } else {
                    $name = $user['name'] ?? trim(($user['firstName'] ?? '') . ' ' . ($user['lastName'] ?? ''));
                    
                    echo "<h2>Edit WhatsApp Number</h2>";
                    echo "<div class='info'>";
                    echo "<strong>User:</strong> " . htmlspecialchars($name) . "<br>";
                    echo "<strong>Email:</strong> " . htmlspecialchars($user['email']) . "<br>";
                    echo "<strong>Current WhatsApp:</strong> " . htmlspecialchars($user['whatsapp'] ?? 'Not set') . "<br>";
                    echo "</div>";
                    
                    echo "<form method='POST' action='?action=edit&user_id=$userId'>";
                    echo "<div class='form-group'>";
                    echo "<label class='form-label'>WhatsApp Number *</label>";
                    echo "<input type='tel' class='form-input' name='whatsapp' value='" . htmlspecialchars($user['whatsapp'] ?? '') . "' placeholder='+256703268522' required>";
                    echo "<small style='color: #7f8c8d;'>Format: +countrycode number (e.g., +256703268522)</small>";
                    echo "</div>";
                    echo "<button type='submit' name='update_whatsapp' class='btn'>💾 Update WhatsApp Number</button>";
                    echo "<a href='?' class='btn' style='background:#95a5a6;'>Cancel</a>";
                    echo "</form>";
                }
                
            } else {
                // List all users
                echo "<div class='info'>";
                echo "This tool allows you to add or update WhatsApp numbers for users who didn't provide them during registration.<br>";
                echo "The registration form has a WhatsApp field (required), but some users may have registered before it was required.";
                echo "</div>";
                
                // Statistics
                $totalStmt = $pdo->query("SELECT COUNT(*) FROM users");
                $total = $totalStmt->fetchColumn();
                
                $withWhatsAppStmt = $pdo->query("SELECT COUNT(*) FROM users WHERE whatsapp IS NOT NULL AND whatsapp != ''");
                $withWhatsApp = $withWhatsAppStmt->fetchColumn();
                
                $withoutWhatsApp = $total - $withWhatsApp;
                
                echo "<div class='stats'>";
                echo "<div class='stat-box'><h3>Total Users</h3><div class='number'>$total</div></div>";
                echo "<div class='stat-box'><h3>With WhatsApp</h3><div class='number' style='color:#27ae60;'>$withWhatsApp</div></div>";
                echo "<div class='stat-box'><h3>Without WhatsApp</h3><div class='number' style='color:#e74c3c;'>$withoutWhatsApp</div></div>";
                echo "</div>";
                
                // Get all users
                $stmt = $pdo->query("
                    SELECT id, email, firstName, lastName, name, whatsapp, gender, createdAt 
                    FROM users 
                    ORDER BY 
                        CASE WHEN whatsapp IS NULL OR whatsapp = '' THEN 0 ELSE 1 END,
                        createdAt DESC
                ");
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (empty($users)) {
                    echo "<div class='warning'>⚠️ No users found in database</div>";
                } else {
                    echo "<h2>All Users</h2>";
                    echo "<table>";
                    echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>WhatsApp</th><th>Status</th><th>Action</th></tr>";
                    
                    foreach ($users as $user) {
                        $name = $user['name'] ?? trim(($user['firstName'] ?? '') . ' ' . ($user['lastName'] ?? ''));
                        if (empty($name)) $name = 'N/A';
                        
                        $hasWhatsApp = !empty($user['whatsapp']);
                        $status = $hasWhatsApp ? '<span class="badge badge-success">✅ Has WhatsApp</span>' : '<span class="badge badge-warning">⚠️ Missing</span>';
                        
                        echo "<tr>";
                        echo "<td>" . htmlspecialchars($user['id']) . "</td>";
                        echo "<td>" . htmlspecialchars($name) . "</td>";
                        echo "<td>" . htmlspecialchars($user['email'] ?? 'N/A') . "</td>";
                        echo "<td>" . htmlspecialchars($user['whatsapp'] ?? '<em style="color:#e74c3c;">Not set</em>') . "</td>";
                        echo "<td>$status</td>";
                        echo "<td><a href='?action=edit&user_id=" . $user['id'] . "' class='btn btn-edit'>✏️ Edit</a></td>";
                        echo "</tr>";
                    }
                    
                    echo "</table>";
                    
                    if ($withoutWhatsApp > 0) {
                        echo "<div class='warning'>";
                        echo "⚠️ <strong>$withoutWhatsApp user(s) don't have WhatsApp numbers.</strong><br>";
                        echo "They cannot receive WhatsApp notifications. Click 'Edit' to add their WhatsApp numbers.";
                        echo "</div>";
                    }
                }
            }
            
        } catch (Exception $e) {
            echo "<div class='error'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</div>";
        }
        ?>
        
        <hr>
        <div style="margin-top: 20px;">
            <a href="check_registration_database.php" class="btn" style="background:#95a5a6;">← Back to Database Check</a>
            <a href="test_send_whatsapp_notifications.php" class="btn" style="background:#3498db;">📤 Test Notifications</a>
        </div>
    </div>
</body>
</html>

