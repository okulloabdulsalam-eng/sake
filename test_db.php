<?php
/**
 * Database Connection Test Script for kiuma_main
 * Use this to verify your database configuration
 */

require_once 'config/database.php';

echo "<!DOCTYPE html><html><head><title>KIUMA Database Test</title>";
echo "<style>body{font-family:Arial,sans-serif;padding:20px;background:#f5f5f5;}";
echo "h2{color:#333;} .success{color:green;} .error{color:red;}";
echo "table{border-collapse:collapse;margin:20px 0;background:white;}";
echo "th,td{border:1px solid #ddd;padding:8px;text-align:left;}";
echo "th{background:#4CAF50;color:white;}</style></head><body>";

echo "<h2>KIUMA Database Connection Test</h2>";
echo "<p><strong>Database:</strong> " . DB_NAME . "</p>";
echo "<p><strong>Host:</strong> " . DB_HOST . "</p>";

try {
    $pdo = getDBConnection();
    echo "<p class='success'>✓ Database connection successful!</p>";
    
    // Get all tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (count($tables) > 0) {
        echo "<h3>Database Tables (" . count($tables) . "):</h3>";
        echo "<ul>";
        foreach ($tables as $table) {
            echo "<li><strong>$table</strong>";
            
            // Count records in each table
            try {
                $countStmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
                $count = $countStmt->fetch()['count'];
                echo " - <em>$count records</em>";
            } catch (Exception $e) {
                echo " - <em>Error counting</em>";
            }
            echo "</li>";
        }
        echo "</ul>";
        
        // Show details for key tables
        $keyTables = ['users', 'library_books', 'media_files', 'recruits', 'notifications', 'prayer_times'];
        
        foreach ($keyTables as $tableName) {
            if (in_array($tableName, $tables)) {
                echo "<h3>Table: $tableName</h3>";
                
                // Show table structure
                $stmt = $pdo->query("DESCRIBE `$tableName`");
                echo "<table>";
                echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>";
                while ($row = $stmt->fetch()) {
                    echo "<tr>";
                    echo "<td>" . htmlspecialchars($row['Field']) . "</td>";
                    echo "<td>" . htmlspecialchars($row['Type']) . "</td>";
                    echo "<td>" . htmlspecialchars($row['Null']) . "</td>";
                    echo "<td>" . htmlspecialchars($row['Key']) . "</td>";
                    echo "<td>" . htmlspecialchars($row['Default'] ?? 'NULL') . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
                
                // Count records
                $countStmt = $pdo->query("SELECT COUNT(*) as count FROM `$tableName`");
                $count = $countStmt->fetch()['count'];
                echo "<p>Total records: <strong>$count</strong></p>";
            }
        }
    } else {
        echo "<p class='error'>✗ No tables found in database. Please import database/kiuma_complete_schema.sql</p>";
    }
    
} catch (Exception $e) {
    echo "<p class='error'>✗ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Please check your database configuration in config/database.php</p>";
    echo "<p><strong>Common issues:</strong></p>";
    echo "<ul>";
    echo "<li>Database name is incorrect</li>";
    echo "<li>MySQL password is incorrect (XAMPP default is empty)</li>";
    echo "<li>MySQL service is not running in XAMPP</li>";
    echo "<li>Database doesn't exist - import database/kiuma_complete_schema.sql</li>";
    echo "</ul>";
}

echo "<hr>";
echo "<p><small>Delete this file after testing for security.</small></p>";
echo "</body></html>";
?>

