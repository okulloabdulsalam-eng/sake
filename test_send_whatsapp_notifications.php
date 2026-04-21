<?php
/**
 * Test Sending WhatsApp Notifications
 * This script will:
 * 1. Check users in database
 * 2. Send a test notification to all users with WhatsApp numbers
 * 3. Show detailed results
 */

require_once __DIR__ . '/api/library_media_config.php';
require_once __DIR__ . '/api/whatsapp_integration.php';

header('Content-Type: text/html; charset=utf-8');

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test WhatsApp Notifications</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            background: #f5f5f5;
            line-height: 1.6;
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
        .btn {
            padding: 12px 24px;
            background: #27ae60;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
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
        pre {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-size: 12px;
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
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 Test WhatsApp Notifications</h1>
        
        <?php
        $sendTest = isset($_GET['send']) && $_GET['send'] === 'yes';
        
        try {
            $pdo = getDBConnection();
            
            // ============================================
            // STEP 1: Check Configuration
            // ============================================
            echo "<h2>Step 1: Configuration Check</h2>";
            echo "<div class='info'>";
            echo "<strong>WhatsApp Service:</strong> " . (defined('WHATSAPP_SERVICE') ? WHATSAPP_SERVICE : 'Not set') . "<br>";
            echo "<strong>Twilio Account SID:</strong> " . (defined('TWILIO_ACCOUNT_SID') && !empty(TWILIO_ACCOUNT_SID) ? substr(TWILIO_ACCOUNT_SID, 0, 10) . '...' : 'Not configured') . "<br>";
            echo "<strong>Twilio Auth Token:</strong> " . (defined('TWILIO_AUTH_TOKEN') && !empty(TWILIO_AUTH_TOKEN) ? 'Configured' : 'Not configured') . "<br>";
            echo "<strong>Twilio WhatsApp Number:</strong> " . (defined('TWILIO_WHATSAPP_NUMBER') ? TWILIO_WHATSAPP_NUMBER : 'Not set') . "<br>";
            echo "</div>";
            
            // ============================================
            // STEP 2: Get Users from Database
            // ============================================
            echo "<h2>Step 2: Users in Database</h2>";
            
            $stmt = $pdo->query("
                SELECT id, email, whatsapp, firstName, lastName, name 
                FROM users 
                WHERE (email IS NOT NULL AND email != '') OR (whatsapp IS NOT NULL AND whatsapp != '')
                ORDER BY id DESC
            ");
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($users)) {
                echo "<div class='warning'>⚠️ No users found in database with email or WhatsApp numbers.</div>";
                echo "<div class='info'>💡 To add test users, run this SQL in phpMyAdmin:</div>";
                echo "<pre>INSERT INTO users (email, password, firstName, lastName, whatsapp) 
VALUES 
    ('test1@example.com', 'hashed_password', 'John', 'Doe', '+256703268522'),
    ('test2@example.com', 'hashed_password', 'Jane', 'Smith', '+256700000000');</pre>";
            } else {
                $usersWithWhatsApp = array_filter($users, function($u) {
                    return !empty($u['whatsapp']);
                });
                $usersWithEmail = array_filter($users, function($u) {
                    return !empty($u['email']);
                });
                
                echo "<div class='stats'>";
                echo "<div class='stat-box'><h3>Total Users</h3><div class='number'>" . count($users) . "</div></div>";
                echo "<div class='stat-box'><h3>With WhatsApp</h3><div class='number'>" . count($usersWithWhatsApp) . "</div></div>";
                echo "<div class='stat-box'><h3>With Email</h3><div class='number'>" . count($usersWithEmail) . "</div></div>";
                echo "</div>";
                
                echo "<table>";
                echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>WhatsApp</th></tr>";
                foreach ($users as $user) {
                    echo "<tr>";
                    echo "<td>" . htmlspecialchars($user['id']) . "</td>";
                    echo "<td>" . htmlspecialchars($user['name'] ?? ($user['firstName'] . ' ' . $user['lastName']) ?? 'N/A') . "</td>";
                    echo "<td>" . htmlspecialchars($user['email'] ?? 'N/A') . "</td>";
                    echo "<td>" . htmlspecialchars($user['whatsapp'] ?? 'N/A') . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
                
                // ============================================
                // STEP 3: Send Test Notification
                // ============================================
                echo "<h2>Step 3: Send Test Notification</h2>";
                
                if (!$sendTest) {
                    echo "<div class='info'>";
                    echo "This will send a test WhatsApp message to all users with WhatsApp numbers.<br>";
                    echo "<strong>⚠️ This will send REAL WhatsApp messages!</strong><br>";
                    echo "Click the button below to send test notifications.";
                    echo "</div>";
                    echo "<a href='?send=yes'><button class='btn'>🚀 Send Test Notification to All Users</button></a>";
                    echo "<div class='warning'>💡 Make sure Twilio sandbox is set up and test numbers are verified!</div>";
                } else {
                    // Actually send notifications
                    $testMessage = "🧪 Test Notification from KIUMA\n\nThis is a test message to verify WhatsApp notifications are working. If you receive this, the system is configured correctly!\n\nTime: " . date('Y-m-d H:i:s');
                    
                    $whatsappSent = 0;
                    $whatsappFailed = 0;
                    $results = [];
                    
                    echo "<div class='info'>📤 Sending test notifications...</div>";
                    
                    foreach ($usersWithWhatsApp as $user) {
                        $result = [
                            'userId' => $user['id'],
                            'name' => $user['name'] ?? ($user['firstName'] . ' ' . $user['lastName']),
                            'whatsapp' => $user['whatsapp'],
                            'status' => 'pending',
                            'message' => '',
                            'error' => null
                        ];
                        
                        echo "<div class='info'>Sending to: " . htmlspecialchars($user['whatsapp']) . " (" . htmlspecialchars($result['name']) . ")</div>";
                        
                        // Send WhatsApp
                        $whatsappResult = sendWhatsApp($user['whatsapp'], $testMessage);
                        
                        if ($whatsappResult['success']) {
                            $result['status'] = 'sent';
                            $result['message'] = $whatsappResult['message'];
                            $whatsappSent++;
                            echo "<div class='success'>✅ Sent successfully to " . htmlspecialchars($user['whatsapp']) . "</div>";
                        } else {
                            $result['status'] = 'failed';
                            $result['error'] = $whatsappResult['message'];
                            $whatsappFailed++;
                            echo "<div class='error'>❌ Failed to send to " . htmlspecialchars($user['whatsapp']) . ": " . htmlspecialchars($whatsappResult['message']) . "</div>";
                            
                            // Show detailed error if available
                            if (isset($whatsappResult['data'])) {
                                echo "<pre>" . htmlspecialchars(json_encode($whatsappResult['data'], JSON_PRETTY_PRINT)) . "</pre>";
                            }
                        }
                        
                        $results[] = $result;
                        
                        // Small delay to avoid rate limiting
                        usleep(500000); // 0.5 seconds
                    }
                    
                    // ============================================
                    // STEP 4: Results Summary
                    // ============================================
                    echo "<h2>Step 4: Results Summary</h2>";
                    
                    echo "<div class='stats'>";
                    echo "<div class='stat-box'><h3>Total Sent</h3><div class='number' style='color: #27ae60;'>$whatsappSent</div></div>";
                    echo "<div class='stat-box'><h3>Failed</h3><div class='number' style='color: #e74c3c;'>$whatsappFailed</div></div>";
                    echo "</div>";
                    
                    echo "<table>";
                    echo "<tr><th>User</th><th>WhatsApp</th><th>Status</th><th>Details</th></tr>";
                    foreach ($results as $result) {
                        $statusColor = $result['status'] === 'sent' ? '✅' : '❌';
                        echo "<tr>";
                        echo "<td>" . htmlspecialchars($result['name']) . "</td>";
                        echo "<td>" . htmlspecialchars($result['whatsapp']) . "</td>";
                        echo "<td>$statusColor " . htmlspecialchars(ucfirst($result['status'])) . "</td>";
                        echo "<td>" . htmlspecialchars($result['error'] ?? $result['message']) . "</td>";
                        echo "</tr>";
                    }
                    echo "</table>";
                    
                    if ($whatsappSent > 0) {
                        echo "<div class='success'>✅ Successfully sent $whatsappSent WhatsApp notification(s)!</div>";
                        echo "<div class='info'>💡 Check the recipients' WhatsApp to verify messages were received.</div>";
                    }
                    
                    if ($whatsappFailed > 0) {
                        echo "<div class='warning'>⚠️ $whatsappFailed notification(s) failed to send. Common reasons:</div>";
                        echo "<ul>";
                        echo "<li>Number not verified in Twilio WhatsApp sandbox</li>";
                        echo "<li>Incorrect phone number format (must include country code like +256...)</li>";
                        echo "<li>Twilio credentials incorrect or expired</li>";
                        echo "<li>Twilio account limitations or restrictions</li>";
                        echo "</ul>";
                        echo "<div class='info'>💡 Check Twilio Console logs for detailed error information.</div>";
                    }
                }
            }
            
        } catch (Exception $e) {
            echo "<div class='error'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</div>";
            echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
        }
        ?>
        
        <hr>
        <div class='info'>
            <h3>📝 Notes:</h3>
            <ul>
                <li><strong>Twilio Sandbox:</strong> For testing, recipients must join the Twilio WhatsApp sandbox. They need to send "join [code]" to +14155238886</li>
                <li><strong>Production:</strong> For production, you need an approved WhatsApp Business account from Meta</li>
                <li><strong>Rate Limits:</strong> Twilio has rate limits - sending too many messages too quickly may fail</li>
                <li><strong>Verification:</strong> Recipients should check their WhatsApp to confirm receipt</li>
            </ul>
        </div>
        
        <p><small><a href="test_notifications_db.php">← Back to Database Tests</a> | <a href="?">Refresh</a></small></p>
    </div>
</body>
</html>

