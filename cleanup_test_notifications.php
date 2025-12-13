<?php
/**
 * Cleanup Test Notifications
 * Removes test notifications created during database testing
 */

require_once __DIR__ . '/api/library_media_config.php';

header('Content-Type: text/html; charset=utf-8');

?>
<!DOCTYPE html>
<html>
<head>
    <title>Cleanup Test Notifications</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success { color: #27ae60; padding: 10px; background: #d5f4e6; border-left: 4px solid #27ae60; margin: 10px 0; }
        .error { color: #e74c3c; padding: 10px; background: #fadbd8; border-left: 4px solid #e74c3c; margin: 10px 0; }
        .info { color: #3498db; padding: 10px; background: #ebf5fb; border-left: 4px solid #3498db; margin: 10px 0; }
        .warning { color: #f39c12; padding: 10px; background: #fef5e7; border-left: 4px solid #f39c12; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #3498db; color: white; }
        button { padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background: #c0392b; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧹 Cleanup Test Notifications</h1>
        
        <?php
        try {
            $pdo = getDBConnection();
            
            // Find test notifications
            $stmt = $pdo->query("
                SELECT id, title, type, created_date 
                FROM notifications 
                WHERE title LIKE 'Test%' 
                   OR type = '' 
                   OR type IS NULL
                ORDER BY id DESC
            ");
            $testNotifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($testNotifications)) {
                echo "<div class='success'>✅ No test notifications found. Database is clean!</div>";
            } else {
                echo "<div class='warning'>Found " . count($testNotifications) . " test/invalid notification(s):</div>";
                
                echo "<table>";
                echo "<tr><th>ID</th><th>Title</th><th>Type</th><th>Created</th></tr>";
                foreach ($testNotifications as $notif) {
                    echo "<tr>";
                    echo "<td>" . htmlspecialchars($notif['id']) . "</td>";
                    echo "<td>" . htmlspecialchars($notif['title']) . "</td>";
                    echo "<td>" . htmlspecialchars($notif['type'] ?: 'NULL/Empty') . "</td>";
                    echo "<td>" . htmlspecialchars($notif['created_date']) . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
                
                // Check if cleanup was requested
                if (isset($_GET['cleanup']) && $_GET['cleanup'] === 'yes') {
                    $ids = array_column($testNotifications, 'id');
                    $placeholders = implode(',', array_fill(0, count($ids), '?'));
                    
                    $deleteStmt = $pdo->prepare("DELETE FROM notifications WHERE id IN ($placeholders)");
                    $deleteStmt->execute($ids);
                    $deletedCount = $deleteStmt->rowCount();
                    
                    echo "<div class='success'>✅ Successfully deleted $deletedCount test notification(s)!</div>";
                    echo "<div class='info'><a href='?'>Refresh page</a> to verify cleanup</div>";
                } else {
                    echo "<div class='info'>⚠️ To delete these notifications, click the button below:</div>";
                    echo "<a href='?cleanup=yes'><button>Delete Test Notifications</button></a>";
                    echo "<div class='info' style='margin-top: 10px;'>Or run this SQL manually:</div>";
                    $ids = array_column($testNotifications, 'id');
                    echo "<pre>DELETE FROM notifications WHERE id IN (" . implode(', ', $ids) . ");</pre>";
                }
            }
            
            // Show all notifications count
            $countStmt = $pdo->query("SELECT COUNT(*) as total FROM notifications");
            $total = $countStmt->fetch()['total'];
            echo "<div class='info' style='margin-top: 20px;'><strong>Total notifications in database:</strong> $total</div>";
            
        } catch (Exception $e) {
            echo "<div class='error'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</div>";
        }
        ?>
        
        <hr>
        <p><small><a href="test_notifications_db.php">← Back to Database Tests</a></small></p>
    </div>
</body>
</html>

