<?php
/**
 * Check Detailed Information Saved for Registered Users
 * Shows exactly what data was captured during registration
 */

header('Content-Type: text/html; charset=utf-8');

$dbPath = __DIR__ . '/kiuma_users.db';

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>User Registration Details</title>
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
        .user-card {
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }
        .field {
            margin: 10px 0;
            padding: 8px;
            background: white;
            border-radius: 4px;
        }
        .field-label {
            font-weight: bold;
            color: #34495e;
            display: inline-block;
            width: 150px;
        }
        .field-value {
            color: #2c3e50;
        }
        .missing {
            color: #e74c3c;
            font-style: italic;
        }
        .present {
            color: #27ae60;
        }
        .info {
            color: #3498db;
            padding: 15px;
            background: #ebf5fb;
            border-left: 4px solid #3498db;
            margin: 15px 0;
            border-radius: 4px;
        }
        .warning {
            color: #f39c12;
            padding: 15px;
            background: #fef5e7;
            border-left: 4px solid #f39c12;
            margin: 15px 0;
            border-radius: 4px;
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
    </style>
</head>
<body>
    <div class="container">
        <h1>📋 User Registration Details Analysis</h1>
        
        <?php
        if (!file_exists($dbPath)) {
            echo "<div class='warning'>❌ SQLite database file not found: kiuma_users.db</div>";
            exit;
        }
        
        try {
            $db = new PDO('sqlite:' . $dbPath);
            $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Get table structure
            $stmt = $db->query("PRAGMA table_info(users)");
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $columnNames = array_column($columns, 'name');
            
            // Get all users
            $stmt = $db->query("SELECT * FROM users ORDER BY createdAt DESC");
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo "<div class='info'>";
            echo "<strong>Total Users:</strong> " . count($users) . "<br>";
            echo "<strong>Database Columns:</strong> " . implode(', ', $columnNames) . "<br>";
            echo "</div>";
            
            if (empty($users)) {
                echo "<div class='warning'>No users found in database.</div>";
                exit;
            }
            
            // Analysis summary
            $analysis = [
                'hasEmail' => 0,
                'hasWhatsApp' => 0,
                'hasName' => 0,
                'hasFirstName' => 0,
                'hasLastName' => 0,
                'hasGender' => 0,
                'hasPassword' => 0
            ];
            
            foreach ($users as $user) {
                if (!empty($user['email'])) $analysis['hasEmail']++;
                if (!empty($user['whatsapp'])) $analysis['hasWhatsApp']++;
                if (!empty($user['name'])) $analysis['hasName']++;
                if (!empty($user['firstName'])) $analysis['hasFirstName']++;
                if (!empty($user['lastName'])) $analysis['hasLastName']++;
                if (!empty($user['gender'])) $analysis['hasGender']++;
                if (!empty($user['password'])) $analysis['hasPassword']++;
            }
            
            echo "<h2>Data Completeness Summary</h2>";
            echo "<table>";
            echo "<tr><th>Field</th><th>Users With Data</th><th>Percentage</th></tr>";
            
            $total = count($users);
            foreach ($analysis as $field => $count) {
                $percentage = $total > 0 ? round(($count / $total) * 100, 1) : 0;
                $status = $count === $total ? '✅' : ($count > 0 ? '⚠️' : '❌');
                
                echo "<tr>";
                echo "<td><strong>" . ucfirst($field) . "</strong></td>";
                echo "<td>$status $count / $total</td>";
                echo "<td>$percentage%</td>";
                echo "</tr>";
            }
            echo "</table>";
            
            // Detailed view for each user
            echo "<h2>Individual User Details</h2>";
            
            foreach ($users as $index => $user) {
                $name = trim(($user['firstName'] ?? '') . ' ' . ($user['lastName'] ?? ''));
                if (empty($name)) $name = $user['name'] ?? 'Unnamed User';
                
                echo "<div class='user-card'>";
                echo "<h3>User #" . ($index + 1) . ": " . htmlspecialchars($name) . "</h3>";
                
                foreach ($columnNames as $colName) {
                    $value = $user[$colName] ?? null;
                    $isSet = $value !== null && $value !== '';
                    
                    echo "<div class='field'>";
                    echo "<span class='field-label'>" . htmlspecialchars(ucfirst($colName)) . ":</span> ";
                    
                    if ($colName === 'password') {
                        echo "<span class='field-value'>***HIDDEN*** (" . strlen($value ?? '') . " characters, " . ($isSet ? '<span class="present">hashed</span>' : '<span class="missing">missing</span>') . ")</span>";
                    } else {
                        $displayValue = $isSet ? htmlspecialchars($value) : '<span class="missing">[Not provided]</span>';
                        $status = $isSet ? '<span class="present">✅</span>' : '<span class="missing">❌</span>';
                        echo "<span class='field-value'>$status $displayValue</span>";
                    }
                    echo "</div>";
                }
                
                // Special analysis
                echo "<div style='margin-top:15px;padding:10px;background:#fff3cd;border-radius:4px;'>";
                echo "<strong>Analysis:</strong><br>";
                
                $issues = [];
                if (empty($user['whatsapp'])) {
                    $issues[] = "⚠️ No WhatsApp number - cannot receive WhatsApp notifications";
                }
                if (empty($user['email'])) {
                    $issues[] = "⚠️ No email address - cannot receive email notifications";
                }
                if (empty($user['firstName']) && empty($user['lastName']) && empty($user['name'])) {
                    $issues[] = "⚠️ No name information";
                }
                
                if (empty($issues)) {
                    echo "✅ All required information present for notifications";
                } else {
                    echo implode('<br>', $issues);
                }
                
                echo "</div>";
                echo "</div>";
            }
            
            // Recommendations
            echo "<h2>Recommendations</h2>";
            echo "<div class='info'>";
            
            if ($analysis['hasWhatsApp'] < $total) {
                echo "⚠️ <strong>WhatsApp Numbers:</strong> " . ($total - $analysis['hasWhatsApp']) . " user(s) don't have WhatsApp numbers. They cannot receive WhatsApp notifications.<br>";
            }
            
            if ($analysis['hasEmail'] < $total) {
                echo "⚠️ <strong>Email Addresses:</strong> " . ($total - $analysis['hasEmail']) . " user(s) don't have email addresses. They cannot receive email notifications.<br>";
            }
            
            if ($analysis['hasWhatsApp'] === 0 && $analysis['hasEmail'] === 0) {
                echo "❌ <strong>Critical:</strong> No users have WhatsApp numbers or email addresses. Notifications cannot be sent!<br>";
            }
            
            if ($analysis['hasWhatsApp'] > 0) {
                echo "✅ " . $analysis['hasWhatsApp'] . " user(s) can receive WhatsApp notifications<br>";
            }
            
            echo "</div>";
            
        } catch (Exception $e) {
            echo "<div class='warning'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</div>";
        }
        ?>
        
        <hr>
        <div style="margin-top: 20px;">
            <a href="view_all_sqlite_users.php" class="btn" style="padding:10px 20px;background:#3498db;color:white;text-decoration:none;border-radius:5px;">← Back</a>
            <a href="sync_databases.php" class="btn" style="padding:10px 20px;background:#27ae60;color:white;text-decoration:none;border-radius:5px;">🔄 Sync to MySQL</a>
        </div>
    </div>
</body>
</html>

