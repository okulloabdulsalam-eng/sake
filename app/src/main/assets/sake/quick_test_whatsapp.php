<?php
/**
 * Quick WhatsApp Test
 * Tests sending to a single number first
 */

require_once __DIR__ . '/api/library_media_config.php';
require_once __DIR__ . '/api/whatsapp_integration.php';

header('Content-Type: text/html; charset=utf-8');

$testNumber = $_GET['number'] ?? '+256703268522'; // Default test number
$send = isset($_GET['send']) && $_GET['send'] === 'yes';

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Quick WhatsApp Test</title>
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
        }
        .success { color: #27ae60; padding: 10px; background: #d5f4e6; border-left: 4px solid #27ae60; margin: 10px 0; }
        .error { color: #e74c3c; padding: 10px; background: #fadbd8; border-left: 4px solid #e74c3c; margin: 10px 0; }
        .info { color: #3498db; padding: 10px; background: #ebf5fb; border-left: 4px solid #3498db; margin: 10px 0; }
        input { padding: 10px; width: 300px; margin: 5px; }
        button { padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background: #229954; }
        pre { background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 Quick WhatsApp Test</h1>
        
        <?php
        if ($send) {
            $testMessage = "🧪 Test Notification from KIUMA\n\nThis is a test message to verify WhatsApp notifications are working!\n\nTime: " . date('Y-m-d H:i:s');
            
            echo "<div class='info'>📤 Sending test message to: <strong>$testNumber</strong></div>";
            
            $result = sendWhatsApp($testNumber, $testMessage);
            
            if ($result['success']) {
                echo "<div class='success'>✅ SUCCESS! Message sent successfully!</div>";
                echo "<div class='info'>Message: " . htmlspecialchars($result['message']) . "</div>";
                if (isset($result['data']['sid'])) {
                    echo "<div class='info'>Twilio SID: " . htmlspecialchars($result['data']['sid']) . "</div>";
                }
                echo "<div class='success' style='margin-top: 20px;'>💬 Check WhatsApp on <strong>$testNumber</strong> to verify the message was received!</div>";
            } else {
                echo "<div class='error'>❌ FAILED to send message</div>";
                echo "<div class='error'>Error: " . htmlspecialchars($result['message']) . "</div>";
                
                if (isset($result['data'])) {
                    echo "<div class='info'>Details:</div>";
                    echo "<pre>" . htmlspecialchars(json_encode($result['data'], JSON_PRETTY_PRINT)) . "</pre>";
                }
                
                echo "<div class='info' style='margin-top: 20px;'>";
                echo "<strong>Common issues:</strong><br>";
                echo "1. Number not verified in Twilio WhatsApp sandbox<br>";
                echo "2. Number format incorrect (must be: +countrycode number)<br>";
                echo "3. Twilio credentials incorrect<br>";
                echo "4. Twilio account issues<br>";
                echo "</div>";
            }
            
            echo "<hr><a href='?'><button>Test Another Number</button></a>";
        } else {
            ?>
            <form method="GET">
                <div class="info">
                    <strong>Enter WhatsApp number to test:</strong><br>
                    <small>Format: +countrycode number (e.g., +256703268522)</small><br>
                    <input type="text" name="number" value="<?php echo htmlspecialchars($testNumber); ?>" placeholder="+256703268522">
                    <input type="hidden" name="send" value="yes">
                    <br><br>
                    <button type="submit">🚀 Send Test Message</button>
                </div>
            </form>
            
            <div class="info" style="margin-top: 20px;">
                <strong>⚠️ Important for Twilio Sandbox:</strong><br>
                The recipient must first join the Twilio WhatsApp sandbox by sending:<br>
                <strong>"join [code]"</strong> to <strong>+14155238886</strong><br>
                Get the join code from: <a href="https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn" target="_blank">Twilio Console</a>
            </div>
            
            <hr>
            <h3>Test All Users in Database</h3>
            <p><a href="test_send_whatsapp_notifications.php"><button>📤 Send to All Users</button></a></p>
            <?php
        }
        ?>
        
        <hr>
        <p><small><a href="test_notifications_db.php">← Back to Tests</a></small></p>
    </div>
</body>
</html>

