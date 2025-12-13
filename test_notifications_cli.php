<?php
/**
 * Command Line Test Script for Notification Database Functionality
 * Run via: php test_notifications_cli.php (or through browser)
 */

require_once __DIR__ . '/api/library_media_config.php';

echo "========================================\n";
echo "Notification Database Test - CLI Version\n";
echo "========================================\n\n";

$tests = 0;
$passed = 0;
$failed = 0;

function test($name, $callback) {
    global $tests, $passed, $failed;
    $tests++;
    echo "[TEST $tests] $name ... ";
    
    try {
        $result = $callback();
        if ($result === true || (is_array($result) && $result['success'] === true)) {
            echo "✅ PASSED\n";
            $passed++;
            if (is_array($result) && isset($result['message'])) {
                echo "   → " . $result['message'] . "\n";
            }
            return true;
        } else {
            echo "❌ FAILED\n";
            $failed++;
            if (is_array($result) && isset($result['message'])) {
                echo "   → " . $result['message'] . "\n";
            }
            return false;
        }
    } catch (Exception $e) {
        echo "❌ FAILED\n";
        echo "   → Error: " . $e->getMessage() . "\n";
        $failed++;
        return false;
    }
}

try {
    // Test 1: Database Connection
    test("Database Connection", function() {
        $pdo = getDBConnection();
        return ['success' => true, 'message' => 'Connected to ' . DB_NAME];
    });
    
    $pdo = getDBConnection();
    
    // Test 2: Table Exists
    test("Notifications Table Exists", function() use ($pdo) {
        $stmt = $pdo->query("SHOW TABLES LIKE 'notifications'");
        $exists = $stmt->rowCount() > 0;
        return ['success' => $exists, 'message' => $exists ? 'Table exists' : 'Table does not exist'];
    });
    
    // Test 3: Create Notification
    $testNotificationId = null;
    test("Create Notification", function() use ($pdo, &$testNotificationId) {
        $stmt = $pdo->prepare("
            INSERT INTO notifications (title, message, type, target_audience, is_read)
            VALUES (?, ?, ?, ?, FALSE)
        ");
        $stmt->execute(['Test Notification', 'Test message for database testing', 'info', 'all']);
        $testNotificationId = $pdo->lastInsertId();
        return ['success' => true, 'message' => "Created notification ID: $testNotificationId"];
    });
    
    // Test 4: Retrieve Notification
    test("Retrieve Notification", function() use ($pdo, $testNotificationId) {
        $stmt = $pdo->prepare("SELECT * FROM notifications WHERE id = ?");
        $stmt->execute([$testNotificationId]);
        $notif = $stmt->fetch();
        return ['success' => !empty($notif), 'message' => $notif ? 'Notification retrieved' : 'Notification not found'];
    });
    
    // Test 5: Update Notification
    test("Update Notification Status", function() use ($pdo, $testNotificationId) {
        $stmt = $pdo->prepare("UPDATE notifications SET is_read = TRUE WHERE id = ?");
        $stmt->execute([$testNotificationId]);
        
        $verify = $pdo->prepare("SELECT is_read FROM notifications WHERE id = ?");
        $verify->execute([$testNotificationId]);
        $updated = $verify->fetch();
        
        return ['success' => $updated && $updated['is_read'] == 1, 'message' => 'Notification marked as read'];
    });
    
    // Test 6: Sorting (Unread First)
    test("Sorting Logic (Unread First)", function() use ($pdo) {
        $stmt = $pdo->query("
            SELECT id, is_read, created_date 
            FROM notifications 
            ORDER BY 
                CASE WHEN is_read = 0 THEN 0 ELSE 1 END,
                created_date DESC
            LIMIT 5
        ");
        $sorted = $stmt->fetchAll();
        $firstUnreadIndex = -1;
        $firstReadIndex = -1;
        
        foreach ($sorted as $index => $item) {
            if ($item['is_read'] == 0 && $firstUnreadIndex == -1) {
                $firstUnreadIndex = $index;
            }
            if ($item['is_read'] == 1 && $firstReadIndex == -1) {
                $firstReadIndex = $index;
            }
        }
        
        $correct = ($firstUnreadIndex == -1 || $firstReadIndex == -1 || $firstUnreadIndex < $firstReadIndex);
        return ['success' => $correct, 'message' => 'Unread notifications appear before read ones'];
    });
    
    // Test 7: Filter by Type
    test("Filter by Type", function() use ($pdo) {
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM notifications WHERE type = ?");
        $stmt->execute(['info']);
        $count = $stmt->fetch()['count'];
        return ['success' => $count > 0, 'message' => "Found $count notifications of type 'info'"];
    });
    
    // Test 8: Count Statistics
    test("Database Statistics", function() use ($pdo) {
        $total = $pdo->query("SELECT COUNT(*) as count FROM notifications")->fetch()['count'];
        $unread = $pdo->query("SELECT COUNT(*) as count FROM notifications WHERE is_read = FALSE")->fetch()['count'];
        return ['success' => $total > 0, 'message' => "Total: $total, Unread: $unread"];
    });
    
    // Cleanup
    if ($testNotificationId) {
        echo "\n[CLEANUP] Removing test notification ID: $testNotificationId ... ";
        try {
            $pdo->prepare("DELETE FROM notifications WHERE id = ?")->execute([$testNotificationId]);
            echo "✅ Done\n";
        } catch (Exception $e) {
            echo "❌ Failed: " . $e->getMessage() . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "\n❌ FATAL ERROR: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n========================================\n";
echo "Test Results: $passed/$tests passed\n";
echo "========================================\n";

if ($failed > 0) {
    exit(1);
} else {
    exit(0);
}

