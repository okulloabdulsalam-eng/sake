<?php
/**
 * Check Twilio Message Status
 * Shows recent messages sent via Twilio and their delivery status
 */

require_once __DIR__ . '/api/library_media_config.php';
require_once __DIR__ . '/api/whatsapp_integration.php';

header('Content-Type: text/html; charset=utf-8');

$twilioSid = defined('TWILIO_ACCOUNT_SID') ? TWILIO_ACCOUNT_SID : '';
$twilioToken = defined('TWILIO_AUTH_TOKEN') ? TWILIO_AUTH_TOKEN : '';

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Check Twilio Message Status</title>
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
            padding: 10px;
            text-align: left;
            font-size: 13px;
        }
        th {
            background: #3498db;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background: #f9f9f9;
        }
        .status-delivered {
            color: #27ae60;
            font-weight: bold;
        }
        .status-sent {
            color: #3498db;
            font-weight: bold;
        }
        .status-failed {
            color: #e74c3c;
            font-weight: bold;
        }
        .status-queued {
            color: #f39c12;
            font-weight: bold;
        }
        pre {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-size: 12px;
        }
        .btn {
            padding: 10px 20px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 5px;
        }
        .btn:hover {
            background: #2980b9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Check Twilio Message Status</h1>
        
        <?php
        if (empty($twilioSid) || empty($twilioToken)) {
            echo "<div class='error'>❌ Twilio credentials not configured</div>";
            echo "<div class='info'>Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in api/whatsapp_integration.php</div>";
            exit;
        }
        
        echo "<div class='info'>";
        echo "<strong>Twilio Account SID:</strong> " . substr($twilioSid, 0, 10) . "...<br>";
        echo "<strong>Status:</strong> Configured<br>";
        echo "</div>";
        
        // Get recent messages from Twilio
        $url = 'https://api.twilio.com/2010-04-01/Accounts/' . $twilioSid . '/Messages.json?PageSize=20';
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERPWD, $twilioSid . ':' . $twilioToken);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            $data = json_decode($response, true);
            
            if (isset($data['messages']) && !empty($data['messages'])) {
                echo "<div class='success'>✅ Found " . count($data['messages']) . " recent message(s)</div>";
                
                echo "<h2>Recent Messages</h2>";
                echo "<table>";
                echo "<tr><th>Date</th><th>To</th><th>From</th><th>Status</th><th>Direction</th><th>SID</th></tr>";
                
                foreach ($data['messages'] as $msg) {
                    $status = strtolower($msg['status'] ?? 'unknown');
                    $statusClass = 'status-' . $status;
                    $statusIcon = '';
                    
                    switch ($status) {
                        case 'delivered':
                            $statusIcon = '✅';
                            break;
                        case 'sent':
                            $statusIcon = '📤';
                            break;
                        case 'failed':
                            $statusIcon = '❌';
                            break;
                        case 'queued':
                            $statusIcon = '⏳';
                            break;
                        default:
                            $statusIcon = '❓';
                    }
                    
                    $date = date('Y-m-d H:i:s', strtotime($msg['date_sent'] ?? $msg['date_created'] ?? 'now'));
                    $to = htmlspecialchars($msg['to'] ?? 'N/A');
                    $from = htmlspecialchars($msg['from'] ?? 'N/A');
                    $sid = htmlspecialchars($msg['sid'] ?? 'N/A');
                    $direction = htmlspecialchars($msg['direction'] ?? 'N/A');
                    
                    // Clean WhatsApp: prefix
                    $to = str_replace('whatsapp:', '', $to);
                    $from = str_replace('whatsapp:', '', $from);
                    
                    echo "<tr>";
                    echo "<td>$date</td>";
                    echo "<td>$to</td>";
                    echo "<td>$from</td>";
                    echo "<td class='$statusClass'>$statusIcon " . ucfirst($status) . "</td>";
                    echo "<td>" . ucfirst($direction) . "</td>";
                    echo "<td style='font-size:11px;'>" . substr($sid, 0, 20) . "...</td>";
                    echo "</tr>";
                }
                
                echo "</table>";
                
                // Statistics
                $delivered = count(array_filter($data['messages'], fn($m) => strtolower($m['status'] ?? '') === 'delivered'));
                $sent = count(array_filter($data['messages'], fn($m) => strtolower($m['status'] ?? '') === 'sent'));
                $failed = count(array_filter($data['messages'], fn($m) => strtolower($m['status'] ?? '') === 'failed'));
                $queued = count(array_filter($data['messages'], fn($m) => strtolower($m['status'] ?? '') === 'queued'));
                
                echo "<h2>Message Statistics</h2>";
                echo "<div class='info'>";
                echo "<strong>Delivered:</strong> $delivered<br>";
                echo "<strong>Sent:</strong> $sent<br>";
                echo "<strong>Failed:</strong> $failed<br>";
                echo "<strong>Queued:</strong> $queued<br>";
                echo "</div>";
                
                if ($failed > 0) {
                    echo "<div class='warning'>";
                    echo "⚠️ Some messages failed. Common reasons:<br>";
                    echo "1. Number not joined to Twilio WhatsApp sandbox<br>";
                    echo "2. Invalid phone number format<br>";
                    echo "3. 24-hour window expired (for production)<br>";
                    echo "4. Account limits reached<br>";
                    echo "</div>";
                }
                
            } else {
                echo "<div class='warning'>⚠️ No messages found in Twilio account</div>";
                echo "<div class='info'>";
                echo "This could mean:<br>";
                echo "• No messages have been sent yet<br>";
                echo "• Messages were sent from a different account<br>";
                echo "• Account credentials might be incorrect<br>";
                echo "</div>";
            }
            
        } else {
            $errorData = json_decode($response, true);
            $errorMsg = $errorData['message'] ?? 'Unknown error';
            
            echo "<div class='error'>❌ Error fetching messages from Twilio</div>";
            echo "<div class='error'>HTTP Code: $httpCode</div>";
            echo "<div class='error'>Error: " . htmlspecialchars($errorMsg) . "</div>";
            
            if ($httpCode === 401) {
                echo "<div class='warning'>";
                echo "⚠️ Authentication failed. Check:<br>";
                echo "1. TWILIO_ACCOUNT_SID is correct<br>";
                echo "2. TWILIO_AUTH_TOKEN is correct<br>";
                echo "3. No extra spaces in credentials<br>";
                echo "</div>";
            }
        }
        ?>
        
        <hr>
        <div class='info'>
            <h3>💡 Why Messages Might Not Be Received</h3>
            <ol>
                <li><strong>Number not in sandbox:</strong> Recipient must send "join [code]" to +14155238886 first</li>
                <li><strong>Wrong format:</strong> Number must be in format +countrycode number (e.g., +256703268522)</li>
                <li><strong>24-hour window:</strong> Outside sandbox, can only send free messages within 24h of user's last message</li>
                <li><strong>Account limits:</strong> Free trial has limited credits - check Twilio Console Dashboard</li>
                <li><strong>Phone issues:</strong> Phone off, WhatsApp not installed, or number blocked</li>
            </ol>
            <p><strong>Best way to verify:</strong> Check Twilio Console → Messaging → Logs for detailed status</p>
        </div>
        
        <div style="margin-top: 20px;">
            <a href="https://console.twilio.com/us1/monitor/logs/messages" target="_blank" class="btn">🔍 Open Twilio Console Logs</a>
            <a href="test_send_whatsapp_notifications.php" class="btn">📤 Test Send Message</a>
            <a href="quick_test_whatsapp.php" class="btn">🧪 Quick Test</a>
        </div>
    </div>
</body>
</html>

