<?php
/**
 * Test Your Twilio Number Setup
 * Tests if your Twilio number +12675507762 is configured correctly
 */

require_once __DIR__ . '/api/library_media_config.php';
require_once __DIR__ . '/api/whatsapp_integration.php';

header('Content-Type: text/html; charset=utf-8');

$testNumber = $_GET['test_number'] ?? '+256703268522';
$sendTest = isset($_GET['send']) && $_GET['send'] === 'yes';

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test Your Twilio Number</title>
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
        .success {
            color: #27ae60;
            padding: 15px;
            background: #d5f4e6;
            border-left: 4px solid #27ae60;
            margin: 15px 0;
        }
        .error {
            color: #e74c3c;
            padding: 15px;
            background: #fadbd8;
            border-left: 4px solid #e74c3c;
            margin: 15px 0;
        }
        .info {
            color: #3498db;
            padding: 15px;
            background: #ebf5fb;
            border-left: 4px solid #3498db;
            margin: 15px 0;
        }
        .warning {
            color: #f39c12;
            padding: 15px;
            background: #fef5e7;
            border-left: 4px solid #f39c12;
            margin: 15px 0;
        }
        input {
            padding: 10px;
            width: 300px;
            margin: 5px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        button {
            padding: 12px 24px;
            background: #27ae60;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: #229954;
        }
        pre {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 Test Your Twilio Number: +12675507762</h1>
        
        <?php
        // Check configuration
        echo "<div class='info'>";
        echo "<strong>Your Twilio Number:</strong> +12675507762<br>";
        echo "<strong>Account SID:</strong> " . (defined('TWILIO_ACCOUNT_SID') ? substr(TWILIO_ACCOUNT_SID, 0, 10) . '...' : 'Not configured') . "<br>";
        echo "<strong>Auth Token:</strong> " . (defined('TWILIO_AUTH_TOKEN') && !empty(TWILIO_AUTH_TOKEN) ? 'Configured' : 'Not configured') . "<br>";
        echo "</div>";
        
        // Determine if this is sandbox or production
        $isSandbox = (TWILIO_WHATSAPP_NUMBER ?? '') === '+14155238886';
        $isCustomNumber = (TWILIO_WHATSAPP_NUMBER ?? '') === '+12675507762';
        
        if ($isCustomNumber) {
            echo "<div class='info'>";
            echo "<strong>Number Type:</strong> Custom Twilio Number<br>";
            echo "This could be:<br>";
            echo "• A production WhatsApp-enabled number<br>";
            echo "• A custom sandbox number<br>";
            echo "• A regular Twilio number (needs WhatsApp enabled)<br>";
            echo "</div>";
        }
        
        if ($sendTest) {
            $testMessage = "🧪 Test from Your Twilio Number\n\nThis is a test message sent from your Twilio number: +12675507762\n\nTime: " . date('Y-m-d H:i:s');
            
            echo "<div class='info'>📤 Sending test message to: <strong>$testNumber</strong></div>";
            
            $result = sendWhatsApp($testNumber, $testMessage);
            
            if ($result['success']) {
                echo "<div class='success'>";
                echo "✅ <strong>SUCCESS!</strong> Message sent successfully!<br>";
                echo "Message: " . htmlspecialchars($result['message']) . "<br>";
                if (isset($result['data']['sid'])) {
                    echo "Twilio SID: " . htmlspecialchars($result['data']['sid']) . "<br>";
                    echo "<a href='https://console.twilio.com/us1/monitor/logs/messages' target='_blank'>🔍 Check in Twilio Console</a>";
                }
                echo "</div>";
                
                echo "<div class='info' style='margin-top:20px;'>";
                echo "<strong>Next Steps:</strong><br>";
                echo "1. Check WhatsApp on <strong>$testNumber</strong><br>";
                echo "2. If message received → Your number is working! ✅<br>";
                echo "3. If message not received → Check error below or Twilio Console logs<br>";
                echo "</div>";
            } else {
                echo "<div class='error'>";
                echo "❌ <strong>FAILED</strong> to send message<br>";
                echo "Error: " . htmlspecialchars($result['message']) . "<br>";
                echo "</div>";
                
                if (isset($result['data'])) {
                    echo "<div class='warning'>";
                    echo "<strong>Error Details:</strong><br>";
                    echo "<pre>" . htmlspecialchars(json_encode($result['data'], JSON_PRETTY_PRINT)) . "</pre>";
                    echo "</div>";
                }
                
                echo "<div class='info'>";
                echo "<strong>Common Issues with Custom Numbers:</strong><br><br>";
                echo "<strong>1. Number Not WhatsApp-Enabled:</strong><br>";
                echo "   • Check Twilio Console → Phone Numbers → Your number<br>";
                echo "   • Ensure WhatsApp capability is enabled<br><br>";
                
                echo "<strong>2. Production vs Sandbox:</strong><br>";
                echo "   • If production: Can send to any number (pay-per-message)<br>";
                echo "   • If sandbox: Users must join first<br><br>";
                
                echo "<strong>3. Number Format:</strong><br>";
                echo "   • Must be in format: +countrycode number<br>";
                echo "   • Example: +12675507762 or +256703268522<br><br>";
                
                echo "<strong>4. Check Twilio Console:</strong><br>";
                echo "   • Go to: <a href='https://console.twilio.com/us1/monitor/logs/messages' target='_blank'>Messaging Logs</a><br>";
                echo "   • Look for error codes and detailed messages<br>";
                echo "</div>";
            }
            
            echo "<hr><a href='?'><button>Test Another Number</button></a>";
            
        } else {
            ?>
            <div class="info">
                <strong>Test Your Twilio Number Configuration</strong><br><br>
                Your Twilio number <strong>+12675507762</strong> is now configured.<br>
                Let's test if it's working correctly.
            </div>
            
            <h2>Send Test Message</h2>
            <form method="GET">
                <div style="margin: 15px 0;">
                    <label><strong>Test Number:</strong></label><br>
                    <input type="tel" name="test_number" value="<?php echo htmlspecialchars($testNumber); ?>" placeholder="+256703268522">
                    <input type="hidden" name="send" value="yes">
                    <br><br>
                    <button type="submit">🚀 Send Test Message</button>
                </div>
            </form>
            
            <div class="warning">
                <strong>⚠️ Important:</strong><br><br>
                <strong>If this is a Production Number:</strong><br>
                • Can send to any WhatsApp number<br>
                • No need for users to join sandbox<br>
                • Pay-per-message pricing applies<br><br>
                
                <strong>If this is a Sandbox Number:</strong><br>
                • Users must send "join [code]" first<br>
                • Only joined numbers can receive messages<br>
                • Free for testing<br><br>
                
                <strong>Check in Twilio Console:</strong><br>
                • Go to Phone Numbers → Your number<br>
                • See if WhatsApp is enabled<br>
                • Check if it's sandbox or production<br>
            </div>
            
            <?php
        }
        ?>
        
        <hr>
        <div class="info">
            <h3>📝 Configuration Updated</h3>
            <p><strong>Your Twilio number is now set to:</strong> <code>+12675507762</code></p>
            <p>This number will be used to send all WhatsApp notifications.</p>
        </div>
        
        <div style="margin-top: 20px;">
            <a href="check_twilio_message_status.php"><button>📊 Check Message Status</button></a>
            <a href="test_send_whatsapp_notifications.php"><button>📤 Test All Users</button></a>
        </div>
    </div>
</body>
</html>

