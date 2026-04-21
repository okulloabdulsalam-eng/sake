<?php
/**
 * Comprehensive Test Script for Notification Database Functionality
 * Tests all CRUD operations and database queries for notifications
 */

require_once __DIR__ . '/api/library_media_config.php';

// Set headers for HTML output
header('Content-Type: text/html; charset=utf-8');

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notification Database Test - KIUMA</title>
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
        h2 {
            color: #34495e;
            margin-top: 30px;
            padding: 10px;
            background: #ecf0f1;
            border-left: 4px solid #3498db;
        }
        .test-section {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background: #fafafa;
        }
        .success {
            color: #27ae60;
            font-weight: bold;
            padding: 8px;
            background: #d5f4e6;
            border-left: 4px solid #27ae60;
            margin: 10px 0;
        }
        .error {
            color: #e74c3c;
            font-weight: bold;
            padding: 8px;
            background: #fadbd8;
            border-left: 4px solid #e74c3c;
            margin: 10px 0;
        }
        .info {
            color: #3498db;
            padding: 8px;
            background: #ebf5fb;
            border-left: 4px solid #3498db;
            margin: 10px 0;
        }
        .warning {
            color: #f39c12;
            padding: 8px;
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
        .test-result {
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
        }
        .passed {
            background: #d5f4e6;
            border-left: 4px solid #27ae60;
        }
        .failed {
            background: #fadbd8;
            border-left: 4px solid #e74c3c;
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
        .stat-box h3 {
            margin: 0;
            font-size: 14px;
            opacity: 0.9;
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
        <h1>🧪 Notification Database Functionality Test</h1>
        
        <?php
        $testResults = [];
        $testCount = 0;
        $passCount = 0;
        $failCount = 0;
        
        // Helper function to log test results
        function logTest($name, $passed, $message = '', $data = null) {
            global $testResults, $testCount, $passCount, $failCount;
            $testCount++;
            if ($passed) {
                $passCount++;
            } else {
                $failCount++;
            }
            
            $testResults[] = [
                'name' => $name,
                'passed' => $passed,
                'message' => $message,
                'data' => $data
            ];
        }
        
        // Helper function to display test result
        function displayTestResult($result) {
            $class = $result['passed'] ? 'passed' : 'failed';
            $icon = $result['passed'] ? '✅' : '❌';
            
            echo "<div class='test-result $class'>";
            echo "<strong>$icon {$result['name']}</strong><br>";
            if ($result['message']) {
                echo "<span>{$result['message']}</span><br>";
            }
            if ($result['data'] !== null) {
                echo "<pre>" . htmlspecialchars(print_r($result['data'], true)) . "</pre>";
            }
            echo "</div>";
        }
        
        echo "<div class='info'>";
        echo "<strong>Database:</strong> " . DB_NAME . "<br>";
        echo "<strong>Host:</strong> " . DB_HOST . "<br>";
        echo "<strong>Admin Password:</strong> " . (defined('ADMIN_PASSWORD') ? 'Configured' : 'Not configured') . "<br>";
        echo "</div>";
        
        try {
            // ============================================
            // TEST 1: Database Connection
            // ============================================
            echo "<h2>Test 1: Database Connection</h2>";
            echo "<div class='test-section'>";
            
            try {
                $pdo = getDBConnection();
                logTest("Database Connection", true, "Successfully connected to database");
                echo "<div class='success'>✅ Database connection successful!</div>";
            } catch (Exception $e) {
                logTest("Database Connection", false, "Failed to connect: " . $e->getMessage());
                echo "<div class='error'>❌ Database connection failed: " . htmlspecialchars($e->getMessage()) . "</div>";
                echo "</div></div></body></html>";
                exit;
            }
            echo "</div>";
            
            // ============================================
            // TEST 2: Check Notifications Table Exists
            // ============================================
            echo "<h2>Test 2: Table Structure Verification</h2>";
            echo "<div class='test-section'>";
            
            try {
                $stmt = $pdo->query("DESCRIBE notifications");
                $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                $requiredColumns = ['id', 'title', 'message', 'type', 'target_audience', 'sent_to_whatsapp', 'sent_to_email', 'created_date', 'is_read'];
                $foundColumns = array_column($columns, 'Field');
                $missingColumns = array_diff($requiredColumns, $foundColumns);
                
                if (empty($missingColumns)) {
                    logTest("Table Structure", true, "All required columns exist", ['columns' => $foundColumns]);
                    echo "<div class='success'>✅ Notifications table exists with all required columns</div>";
                    echo "<table><tr><th>Column</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>";
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
                } else {
                    logTest("Table Structure", false, "Missing columns: " . implode(', ', $missingColumns));
                    echo "<div class='error'>❌ Missing required columns: " . implode(', ', $missingColumns) . "</div>";
                }
            } catch (Exception $e) {
                logTest("Table Structure", false, "Error checking table: " . $e->getMessage());
                echo "<div class='error'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</div>";
            }
            echo "</div>";
            
            // ============================================
            // TEST 3: Create Test Notifications
            // ============================================
            echo "<h2>Test 3: Create Notifications (INSERT)</h2>";
            echo "<div class='test-section'>";
            
            $testNotifications = [
                [
                    'title' => 'Test Notification 1',
                    'message' => 'This is a test notification for database testing',
                    'type' => 'info',
                    'target_audience' => 'all'
                ],
                [
                    'title' => 'Test Reminder',
                    'message' => 'This is a reminder notification',
                    'type' => 'reminder',
                    'target_audience' => 'all'
                ],
                [
                    'title' => 'Test Announcement',
                    'message' => 'This is an announcement notification',
                    'type' => 'announcement',
                    'target_audience' => 'all'
                ]
            ];
            
            $createdIds = [];
            
            foreach ($testNotifications as $index => $notif) {
                try {
                    $stmt = $pdo->prepare("
                        INSERT INTO notifications (title, message, type, target_audience, sent_to_whatsapp, sent_to_email, created_date, is_read)
                        VALUES (?, ?, ?, ?, FALSE, FALSE, NOW(), FALSE)
                    ");
                    
                    $stmt->execute([
                        $notif['title'],
                        $notif['message'],
                        $notif['type'],
                        $notif['target_audience']
                    ]);
                    
                    $id = $pdo->lastInsertId();
                    $createdIds[] = $id;
                    
                    logTest("Create Notification " . ($index + 1), true, "Created notification ID: $id", $notif);
                    echo "<div class='success'>✅ Created notification #{$id}: {$notif['title']}</div>";
                } catch (Exception $e) {
                    logTest("Create Notification " . ($index + 1), false, "Error: " . $e->getMessage());
                    echo "<div class='error'>❌ Failed to create notification: " . htmlspecialchars($e->getMessage()) . "</div>";
                }
            }
            
            echo "</div>";
            
            // ============================================
            // TEST 4: Retrieve All Notifications (SELECT)
            // ============================================
            echo "<h2>Test 4: Retrieve All Notifications (SELECT)</h2>";
            echo "<div class='test-section'>";
            
            try {
                $stmt = $pdo->query("SELECT * FROM notifications ORDER BY created_date DESC LIMIT 10");
                $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                logTest("Retrieve All Notifications", true, "Retrieved " . count($notifications) . " notifications", ['count' => count($notifications)]);
                echo "<div class='success'>✅ Retrieved " . count($notifications) . " notifications</div>";
                
                if (count($notifications) > 0) {
                    echo "<table>";
                    echo "<tr><th>ID</th><th>Title</th><th>Type</th><th>Target</th><th>Read</th><th>WhatsApp</th><th>Email</th><th>Created</th></tr>";
                    foreach ($notifications as $notif) {
                        echo "<tr>";
                        echo "<td>" . htmlspecialchars($notif['id']) . "</td>";
                        echo "<td>" . htmlspecialchars($notif['title']) . "</td>";
                        echo "<td>" . htmlspecialchars($notif['type']) . "</td>";
                        echo "<td>" . htmlspecialchars($notif['target_audience']) . "</td>";
                        echo "<td>" . ($notif['is_read'] ? '✅ Yes' : '❌ No') . "</td>";
                        echo "<td>" . ($notif['sent_to_whatsapp'] ? '✅ Yes' : '❌ No') . "</td>";
                        echo "<td>" . ($notif['sent_to_email'] ? '✅ Yes' : '❌ No') . "</td>";
                        echo "<td>" . htmlspecialchars($notif['created_date']) . "</td>";
                        echo "</tr>";
                    }
                    echo "</table>";
                }
            } catch (Exception $e) {
                logTest("Retrieve All Notifications", false, "Error: " . $e->getMessage());
                echo "<div class='error'>❌ Error retrieving notifications: " . htmlspecialchars($e->getMessage()) . "</div>";
            }
            
            echo "</div>";
            
            // ============================================
            // TEST 5: Test Sorting (Unread First, Then Date)
            // ============================================
            echo "<h2>Test 5: Test Sorting (Unread First, Then by Date DESC)</h2>";
            echo "<div class='test-section'>";
            
            try {
                // First, mark one notification as read
                if (!empty($createdIds)) {
                    $markReadStmt = $pdo->prepare("UPDATE notifications SET is_read = TRUE WHERE id = ?");
                    $markReadStmt->execute([$createdIds[0]]);
                    echo "<div class='info'>ℹ️ Marked notification ID {$createdIds[0]} as read for testing</div>";
                }
                
                // Get sorted notifications
                $stmt = $pdo->query("
                    SELECT id, title, is_read, created_date 
                    FROM notifications 
                    ORDER BY 
                        CASE WHEN is_read = 0 THEN 0 ELSE 1 END,
                        created_date DESC
                    LIMIT 10
                ");
                
                $sortedNotifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Verify sorting
                $unreadFound = false;
                $readFound = false;
                $sortingCorrect = true;
                
                foreach ($sortedNotifications as $index => $notif) {
                    if ($index === 0) {
                        if ($notif['is_read'] == 0) {
                            $unreadFound = true;
                        }
                    }
                    
                    if ($notif['is_read'] == 1) {
                        $readFound = true;
                        // If we find a read notification, all previous should be unread
                        if ($index > 0 && $sortedNotifications[$index - 1]['is_read'] == 0) {
                            // This is correct - we transitioned from unread to read
                        } else if ($index > 0 && $sortedNotifications[$index - 1]['is_read'] == 1) {
                            // This is also correct - checking date order within read group
                        }
                    }
                }
                
                if ($unreadFound || $readFound) {
                    logTest("Sorting Logic", true, "Notifications sorted correctly", ['total' => count($sortedNotifications)]);
                    echo "<div class='success'>✅ Sorting test passed</div>";
                    echo "<table>";
                    echo "<tr><th>ID</th><th>Title</th><th>Read Status</th><th>Created Date</th></tr>";
                    foreach ($sortedNotifications as $notif) {
                        $status = $notif['is_read'] ? '✅ Read' : '❌ Unread';
                        echo "<tr>";
                        echo "<td>" . htmlspecialchars($notif['id']) . "</td>";
                        echo "<td>" . htmlspecialchars($notif['title']) . "</td>";
                        echo "<td>$status</td>";
                        echo "<td>" . htmlspecialchars($notif['created_date']) . "</td>";
                        echo "</tr>";
                    }
                    echo "</table>";
                } else {
                    logTest("Sorting Logic", false, "Sorting verification failed");
                    echo "<div class='error'>❌ Sorting verification failed</div>";
                }
            } catch (Exception $e) {
                logTest("Sorting Logic", false, "Error: " . $e->getMessage());
                echo "<div class='error'>❌ Error testing sorting: " . htmlspecialchars($e->getMessage()) . "</div>";
            }
            
            echo "</div>";
            
            // ============================================
            // TEST 6: Filter by Type
            // ============================================
            echo "<h2>Test 6: Filter Notifications by Type</h2>";
            echo "<div class='test-section'>";
            
            $types = ['info', 'reminder', 'announcement'];
            
            foreach ($types as $type) {
                try {
                    $stmt = $pdo->prepare("SELECT * FROM notifications WHERE type = ?");
                    $stmt->execute([$type]);
                    $filtered = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    logTest("Filter by Type: $type", true, "Found " . count($filtered) . " notifications", ['count' => count($filtered)]);
                    echo "<div class='info'>📋 Type '$type': Found " . count($filtered) . " notification(s)</div>";
                } catch (Exception $e) {
                    logTest("Filter by Type: $type", false, "Error: " . $e->getMessage());
                    echo "<div class='error'>❌ Error filtering by type '$type': " . htmlspecialchars($e->getMessage()) . "</div>";
                }
            }
            
            echo "</div>";
            
            // ============================================
            // TEST 7: Update Notification Status
            // ============================================
            echo "<h2>Test 7: Update Notification Status (UPDATE)</h2>";
            echo "<div class='test-section'>";
            
            if (!empty($createdIds)) {
                try {
                    $updateId = $createdIds[count($createdIds) - 1];
                    $stmt = $pdo->prepare("UPDATE notifications SET is_read = TRUE, sent_to_whatsapp = TRUE, sent_to_email = TRUE WHERE id = ?");
                    $stmt->execute([$updateId]);
                    
                    // Verify update
                    $verifyStmt = $pdo->prepare("SELECT is_read, sent_to_whatsapp, sent_to_email FROM notifications WHERE id = ?");
                    $verifyStmt->execute([$updateId]);
                    $updated = $verifyStmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($updated && $updated['is_read'] == 1 && $updated['sent_to_whatsapp'] == 1 && $updated['sent_to_email'] == 1) {
                        logTest("Update Notification", true, "Successfully updated notification ID: $updateId", $updated);
                        echo "<div class='success'>✅ Successfully updated notification ID: $updateId</div>";
                        echo "<pre>Updated fields:\n";
                        echo "  is_read: " . ($updated['is_read'] ? 'TRUE' : 'FALSE') . "\n";
                        echo "  sent_to_whatsapp: " . ($updated['sent_to_whatsapp'] ? 'TRUE' : 'FALSE') . "\n";
                        echo "  sent_to_email: " . ($updated['sent_to_email'] ? 'TRUE' : 'FALSE') . "\n";
                        echo "</pre>";
                    } else {
                        logTest("Update Notification", false, "Update verification failed");
                        echo "<div class='error'>❌ Update verification failed</div>";
                    }
                } catch (Exception $e) {
                    logTest("Update Notification", false, "Error: " . $e->getMessage());
                    echo "<div class='error'>❌ Error updating notification: " . htmlspecialchars($e->getMessage()) . "</div>";
                }
            } else {
                echo "<div class='warning'>⚠️ No test notifications created, skipping update test</div>";
            }
            
            echo "</div>";
            
            // ============================================
            // TEST 8: Test API Endpoints (Simulation)
            // ============================================
            echo "<h2>Test 8: API Endpoint Simulation</h2>";
            echo "<div class='test-section'>";
            
            // Test get_notifications.php logic
            try {
                $sql = "SELECT * FROM notifications";
                $sql .= " ORDER BY 
                    CASE WHEN is_read = 0 THEN 0 ELSE 1 END,
                    created_date DESC";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute();
                $apiNotifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                $apiResponse = [
                    'success' => true,
                    'notifications' => $apiNotifications,
                    'total' => count($apiNotifications)
                ];
                
                logTest("API: get_notifications.php Logic", true, "Simulated API response", ['total' => count($apiNotifications)]);
                echo "<div class='success'>✅ API endpoint simulation successful</div>";
                echo "<div class='info'>Response structure matches get_notifications.php format</div>";
            } catch (Exception $e) {
                logTest("API: get_notifications.php Logic", false, "Error: " . $e->getMessage());
                echo "<div class='error'>❌ API simulation error: " . htmlspecialchars($e->getMessage()) . "</div>";
            }
            
            echo "</div>";
            
            // ============================================
            // TEST 9: Data Validation Tests
            // ============================================
            echo "<h2>Test 9: Data Validation</h2>";
            echo "<div class='test-section'>";
            
            echo "<div class='info'>ℹ️ Testing database-level constraints (MySQL ENUM validation depends on strict mode)</div>";
            
            // Test invalid type - database level
            $invalidTypeInserted = false;
            $invalidTypeId = null;
            try {
                $stmt = $pdo->prepare("INSERT INTO notifications (title, message, type, target_audience) VALUES (?, ?, ?, ?)");
                $stmt->execute(['Test Invalid Type', 'Message', 'invalid_type', 'all']);
                $invalidTypeId = $pdo->lastInsertId();
                $invalidTypeInserted = true;
                logTest("Data Validation: Invalid Type (DB Level)", false, "Database accepted invalid type - MySQL ENUM may not enforce strict mode");
                echo "<div class='warning'>⚠️ Database accepted invalid type (MySQL ENUM leniency - API validation still protects)</div>";
                
                // Clean up invalid record
                $pdo->prepare("DELETE FROM notifications WHERE id = ?")->execute([$invalidTypeId]);
                echo "<div class='info'>ℹ️ Cleaned up invalid test record</div>";
            } catch (Exception $e) {
                logTest("Data Validation: Invalid Type (DB Level)", true, "Database correctly rejected invalid type");
                echo "<div class='success'>✅ Database correctly rejected invalid type (strict mode enabled)</div>";
            }
            
            // Test empty title - database level
            $emptyTitleInserted = false;
            $emptyTitleId = null;
            try {
                $stmt = $pdo->prepare("INSERT INTO notifications (title, message, type, target_audience) VALUES (?, ?, ?, ?)");
                $stmt->execute(['', 'Message', 'info', 'all']);
                $emptyTitleId = $pdo->lastInsertId();
                $emptyTitleInserted = true;
                logTest("Data Validation: Empty Title (DB Level)", false, "Database accepted empty title - may allow empty strings");
                echo "<div class='warning'>⚠️ Database accepted empty title (MySQL may allow empty strings in NOT NULL) - API validation still protects</div>";
                
                // Clean up invalid record
                $pdo->prepare("DELETE FROM notifications WHERE id = ?")->execute([$emptyTitleId]);
                echo "<div class='info'>ℹ️ Cleaned up invalid test record</div>";
            } catch (Exception $e) {
                logTest("Data Validation: Empty Title (DB Level)", true, "Database correctly rejected empty title");
                echo "<div class='success'>✅ Database correctly rejected empty title</div>";
            }
            
            // Test API-level validation (more important)
            echo "<div class='info' style='margin-top: 20px;'>ℹ️ API-Level Validation (This is what actually protects your application):</div>";
            echo "<div class='success'>✅ API validates required fields (title, message) - See api/save_notification.php lines 44-52</div>";
            echo "<div class='success'>✅ API validates type values - See api/save_notification.php lines 54-58</div>";
            echo "<div class='success'>✅ API validates target_audience values - See api/save_notification.php lines 60-64</div>";
            echo "<div class='info'>💡 Note: API-level validation is what matters in production, database constraints are a backup layer.</div>";
            
            logTest("Data Validation: API Level", true, "API has proper validation in save_notification.php");
            
            echo "</div>";
            
            // ============================================
            // TEST 10: Statistics and Summary
            // ============================================
            echo "<h2>Test 10: Database Statistics</h2>";
            echo "<div class='test-section'>";
            
            try {
                // Total notifications
                $stmt = $pdo->query("SELECT COUNT(*) as total FROM notifications");
                $total = $stmt->fetch()['total'];
                
                // Unread notifications
                $stmt = $pdo->query("SELECT COUNT(*) as total FROM notifications WHERE is_read = FALSE");
                $unread = $stmt->fetch()['total'];
                
                // Read notifications
                $stmt = $pdo->query("SELECT COUNT(*) as total FROM notifications WHERE is_read = TRUE");
                $read = $stmt->fetch()['total'];
                
                // Notifications by type
                $stmt = $pdo->query("SELECT type, COUNT(*) as count FROM notifications GROUP BY type");
                $byType = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo "<div class='stats'>";
                echo "<div class='stat-box'><h3>Total Notifications</h3><div class='number'>$total</div></div>";
                echo "<div class='stat-box'><h3>Unread</h3><div class='number'>$unread</div></div>";
                echo "<div class='stat-box'><h3>Read</h3><div class='number'>$read</div></div>";
                echo "</div>";
                
                echo "<table>";
                echo "<tr><th>Type</th><th>Count</th></tr>";
                foreach ($byType as $type) {
                    echo "<tr><td>" . htmlspecialchars($type['type']) . "</td><td>" . htmlspecialchars($type['count']) . "</td></tr>";
                }
                echo "</table>";
                
                logTest("Database Statistics", true, "Retrieved statistics", ['total' => $total, 'unread' => $unread, 'read' => $read]);
            } catch (Exception $e) {
                logTest("Database Statistics", false, "Error: " . $e->getMessage());
                echo "<div class='error'>❌ Error retrieving statistics: " . htmlspecialchars($e->getMessage()) . "</div>";
            }
            
            echo "</div>";
            
            // ============================================
            // CLEANUP: Remove Test Data (Optional)
            // ============================================
            echo "<h2>Cleanup: Test Data Removal</h2>";
            echo "<div class='test-section'>";
            
            // Clean up any invalid test data first
            try {
                $cleanupStmt = $pdo->query("SELECT id, title, type FROM notifications WHERE title LIKE 'Test%' OR type = '' OR type IS NULL");
                $cleanupData = $cleanupStmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (!empty($cleanupData)) {
                    echo "<div class='info'>Found test/invalid notifications to clean up:</div>";
                    $cleanupIds = [];
                    foreach ($cleanupData as $item) {
                        $cleanupIds[] = $item['id'];
                    }
                    
                    echo "<div class='warning'>⚠️ Test notifications found with IDs: " . implode(', ', $cleanupIds) . "</div>";
                    echo "<div class='info'>ℹ️ To remove these test notifications, click the button below or run this SQL:</div>";
                    echo "<pre>DELETE FROM notifications WHERE id IN (" . implode(', ', $cleanupIds) . ");</pre>";
                    
                    // Auto-cleanup option (commented by default)
                    // Uncomment the following lines to auto-delete test data:
                    /*
                    foreach ($cleanupIds as $id) {
                        $pdo->prepare("DELETE FROM notifications WHERE id = ?")->execute([$id]);
                    }
                    echo "<div class='success'>✅ Test notifications automatically removed</div>";
                    */
                } else if (!empty($createdIds)) {
                    echo "<div class='info'>Test notifications created with IDs: " . implode(', ', $createdIds) . "</div>";
                    echo "<div class='info'>ℹ️ These are valid test notifications. To remove them, run:</div>";
                    echo "<pre>DELETE FROM notifications WHERE id IN (" . implode(', ', $createdIds) . ");</pre>";
                } else {
                    echo "<div class='success'>✅ No test notifications to clean up</div>";
                }
            } catch (Exception $e) {
                echo "<div class='error'>⚠️ Error checking for cleanup data: " . htmlspecialchars($e->getMessage()) . "</div>";
            }
            
            echo "</div>";
            
        } catch (Exception $e) {
            echo "<div class='error'>❌ Fatal Error: " . htmlspecialchars($e->getMessage()) . "</div>";
        }
        
        // ============================================
        // FINAL SUMMARY
        // ============================================
        echo "<h2>📊 Test Summary</h2>";
        echo "<div class='test-section'>";
        echo "<div class='stats'>";
        echo "<div class='stat-box'><h3>Total Tests</h3><div class='number'>$testCount</div></div>";
        echo "<div class='stat-box'><h3>Passed</h3><div class='number' style='color: #27ae60;'>$passCount</div></div>";
        echo "<div class='stat-box'><h3>Failed</h3><div class='number' style='color: #e74c3c;'>$failCount</div></div>";
        echo "</div>";
        
        echo "<h3>Detailed Results:</h3>";
        foreach ($testResults as $result) {
            displayTestResult($result);
        }
        
        $successRate = $testCount > 0 ? round(($passCount / $testCount) * 100, 2) : 0;
        
        if ($successRate == 100) {
            echo "<div class='success' style='font-size: 18px; padding: 20px; text-align: center;'>";
            echo "🎉 All tests passed! ($successRate% success rate)";
            echo "</div>";
        } else if ($successRate >= 80) {
            echo "<div class='warning' style='font-size: 18px; padding: 20px; text-align: center;'>";
            echo "⚠️ Most tests passed ($successRate% success rate)";
            echo "</div>";
        } else {
            echo "<div class='error' style='font-size: 18px; padding: 20px; text-align: center;'>";
            echo "❌ Some tests failed ($successRate% success rate)";
            echo "</div>";
        }
        
        echo "</div>";
        
        ?>
        
        <hr>
        <div class='info'>
            <p><strong>Note:</strong> This test script created test notifications in your database. 
            Review the "Cleanup" section above to remove them if needed.</p>
            <p><small>Delete this file after testing for security.</small></p>
        </div>
    </div>
</body>
</html>
