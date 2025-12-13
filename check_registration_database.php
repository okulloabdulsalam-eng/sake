<?php
/**
 * Check Registration Database
 * Tests if user registration data is being saved to the database
 */

require_once __DIR__ . '/api/library_media_config.php';

header('Content-Type: text/html; charset=utf-8');

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Check Registration Database</title>
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
        h2 {
            color: #34495e;
            margin-top: 30px;
            padding: 10px;
            background: #ecf0f1;
            border-left: 4px solid #3498db;
        }
        .success {
            color: #27ae60;
            font-weight: bold;
            padding: 10px;
            background: #d5f4e6;
            border-left: 4px solid #27ae60;
            margin: 10px 0;
        }
        .error {
            color: #e74c3c;
            font-weight: bold;
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
            background: white;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 10px;
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
        pre {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Check Registration Database</h1>
        
        <?php
        try {
            // ============================================
            // TEST 1: Database Connection
            // ============================================
            echo "<h2>Test 1: Database Connection</h2>";
            
            $pdo = getDBConnection();
            echo "<div class='success'>✅ Successfully connected to database: " . DB_NAME . "</div>";
            
            // ============================================
            // TEST 2: Check Users Table
            // ============================================
            echo "<h2>Test 2: Users Table Structure</h2>";
            
            try {
                $stmt = $pdo->query("DESCRIBE users");
                $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo "<div class='success'>✅ Users table exists</div>";
                echo "<table>";
                echo "<tr><th>Column</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>";
                foreach ($columns as $col) {
                    echo "<tr>";
                    echo "<td><strong>" . htmlspecialchars($col['Field']) . "</strong></td>";
                    echo "<td>" . htmlspecialchars($col['Type']) . "</td>";
                    echo "<td>" . htmlspecialchars($col['Null']) . "</td>";
                    echo "<td>" . htmlspecialchars($col['Key']) . "</td>";
                    echo "<td>" . htmlspecialchars($col['Default'] ?? 'NULL') . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
            } catch (Exception $e) {
                echo "<div class='error'>❌ Users table not found: " . htmlspecialchars($e->getMessage()) . "</div>";
                echo "<div class='info'>💡 You may need to import the database schema: database/kiuma_complete_schema.sql</div>";
            }
            
            // ============================================
            // TEST 3: Count Registered Users
            // ============================================
            echo "<h2>Test 3: Registered Users</h2>";
            
            try {
                $countStmt = $pdo->query("SELECT COUNT(*) as total FROM users");
                $total = $countStmt->fetch()['total'];
                
                echo "<div class='stats'>";
                echo "<div class='stat-box'><h3>Total Users</h3><div class='number'>$total</div></div>";
                
                // Count users with WhatsApp
                $whatsappStmt = $pdo->query("SELECT COUNT(*) as total FROM users WHERE whatsapp IS NOT NULL AND whatsapp != ''");
                $withWhatsApp = $whatsappStmt->fetch()['total'];
                echo "<div class='stat-box'><h3>With WhatsApp</h3><div class='number'>$withWhatsApp</div></div>";
                
                // Count users with Email
                $emailStmt = $pdo->query("SELECT COUNT(*) as total FROM users WHERE email IS NOT NULL AND email != ''");
                $withEmail = $emailStmt->fetch()['total'];
                echo "<div class='stat-box'><h3>With Email</h3><div class='number'>$withEmail</div></div>";
                
                // Recent registrations (last 7 days)
                $recentStmt = $pdo->query("SELECT COUNT(*) as total FROM users WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
                $recent = $recentStmt->fetch()['total'];
                echo "<div class='stat-box'><h3>Last 7 Days</h3><div class='number'>$recent</div></div>";
                echo "</div>";
                
                if ($total == 0) {
                    echo "<div class='warning'>⚠️ No users found in database!</div>";
                    echo "<div class='info'>Possible reasons:</div>";
                    echo "<ul>";
                    echo "<li>Users are registering but data is not being saved</li>";
                    echo "<li>Registration is using a different database (SQLite vs MySQL)</li>";
                    echo "<li>Registration API endpoint is not working</li>";
                    echo "<li>Users haven't registered yet</li>";
                    echo "</ul>";
                } else {
                    echo "<div class='success'>✅ Found $total registered user(s) in database!</div>";
                }
                
            } catch (Exception $e) {
                echo "<div class='error'>❌ Error counting users: " . htmlspecialchars($e->getMessage()) . "</div>";
            }
            
            // ============================================
            // TEST 4: List All Users
            // ============================================
            echo "<h2>Test 4: All Registered Users</h2>";
            
            try {
                $stmt = $pdo->query("
                    SELECT 
                        id, 
                        email, 
                        whatsapp, 
                        firstName, 
                        lastName, 
                        name,
                        gender,
                        createdAt,
                        updatedAt
                    FROM users 
                    ORDER BY createdAt DESC
                    LIMIT 50
                ");
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (empty($users)) {
                    echo "<div class='warning'>⚠️ No users found in database</div>";
                } else {
                    echo "<div class='success'>✅ Found " . count($users) . " user(s)</div>";
                    echo "<table>";
                    echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>WhatsApp</th><th>Gender</th><th>Registered</th></tr>";
                    foreach ($users as $user) {
                        $name = $user['name'] ?? ($user['firstName'] . ' ' . $user['lastName']) ?? 'N/A';
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
                }
                
            } catch (Exception $e) {
                echo "<div class='error'>❌ Error fetching users: " . htmlspecialchars($e->getMessage()) . "</div>";
            }
            
            // ============================================
            // TEST 5: Check Registration API Endpoints
            // ============================================
            echo "<h2>Test 5: Registration System Check</h2>";
            
            echo "<div class='info'>";
            echo "<strong>Possible Registration Systems:</strong><br><br>";
            
            // Check if Node.js server.js exists
            if (file_exists(__DIR__ . '/server.js')) {
                echo "✅ <strong>Node.js Server (server.js)</strong> - Uses SQLite database (kiuma_users.db)<br>";
                echo "   - API Endpoint: POST http://localhost:3000/register<br>";
                echo "   - Database: SQLite file (kiuma_users.db in project root)<br>";
                
                // Check if SQLite file exists
                if (file_exists(__DIR__ . '/kiuma_users.db')) {
                    echo "   - ✅ SQLite database file exists<br>";
                } else {
                    echo "   - ⚠️ SQLite database file NOT found<br>";
                }
            } else {
                echo "❌ Node.js server.js not found<br>";
            }
            
            echo "<br>";
            
            // Check PHP API
            if (file_exists(__DIR__ . '/api/get_all_users.php')) {
                echo "✅ <strong>PHP API (api/get_all_users.php)</strong> - Uses MySQL database<br>";
                echo "   - API Endpoint: GET /api/get_all_users.php<br>";
                echo "   - Database: MySQL (" . DB_NAME . ")<br>";
                echo "   - ✅ MySQL connection configured<br>";
            } else {
                echo "❌ PHP API not found<br>";
            }
            
            echo "<br>";
            echo "<strong>💡 To check which system is being used:</strong><br>";
            echo "1. Check the frontend JavaScript (script.js or frontend-integration.js)<br>";
            echo "2. Look for API_BASE_URL configuration<br>";
            echo "3. Check browser console when users register<br>";
            echo "</div>";
            
            // ============================================
            // TEST 6: Check SQLite Database (if exists)
            // ============================================
            if (file_exists(__DIR__ . '/kiuma_users.db')) {
                echo "<h2>Test 6: SQLite Database Check (Node.js Registration)</h2>";
                
                try {
                    $sqlite = new PDO('sqlite:' . __DIR__ . '/kiuma_users.db');
                    $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                    
                    $sqliteStmt = $sqlite->query("SELECT COUNT(*) as total FROM users");
                    $sqliteTotal = $sqliteStmt->fetch()['total'];
                    
                    if ($sqliteTotal > 0) {
                        echo "<div class='success'>✅ Found $sqliteTotal user(s) in SQLite database!</div>";
                        echo "<div class='warning'>⚠️ Users are being saved to SQLite database, not MySQL!</div>";
                        echo "<div class='info'>💡 To view SQLite users, the Node.js API endpoint must be running</div>";
                    } else {
                        echo "<div class='info'>ℹ️ SQLite database exists but is empty</div>";
                    }
                    
                } catch (Exception $e) {
                    echo "<div class='error'>❌ Error accessing SQLite: " . htmlspecialchars($e->getMessage()) . "</div>";
                }
            }
            
        } catch (Exception $e) {
            echo "<div class='error'>❌ Fatal Error: " . htmlspecialchars($e->getMessage()) . "</div>";
            echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
        }
        ?>
        
        <hr>
        <div class='info'>
            <h3>📝 Summary</h3>
            <p>This test checks if user registration data is being saved to the MySQL database. If users exist, registration is working. If not, check:</p>
            <ul>
                <li>Which registration system is being used (Node.js SQLite vs PHP MySQL)</li>
                <li>Check frontend JavaScript API_BASE_URL configuration</li>
                <li>Check browser console for registration errors</li>
                <li>Verify registration form is submitting correctly</li>
            </ul>
        </div>
        
        <p><small><a href="test_notifications_db.php">← Back to Tests</a></small></p>
    </div>
</body>
</html>

