<?php
/**
 * Quick WhatsApp Test Script
 * 
 * Usage: Open in browser: http://localhost/kimu-mob-html/test_whatsapp.php
 * 
 * This will send a test WhatsApp message to verify the integration is working.
 */

require_once __DIR__ . '/api/whatsapp_integration.php';

// Test number (must be verified in Twilio sandbox)
// Change this to your verified WhatsApp number
$testNumber = '+256703268522';

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Test - KIUMA</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #4CAF50;
            margin-bottom: 20px;
        }
        .test-form {
            margin: 20px 0;
        }
        .test-form input {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        .test-form button {
            background: #4CAF50;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        .test-form button:hover {
            background: #45a049;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 5px;
        }
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        pre {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 WhatsApp Integration Test</h1>
        
        <div class="info result">
            <strong>ℹ️ Instructions:</strong><br>
            1. Enter your WhatsApp number (must be verified in Twilio Sandbox)<br>
            2. Click "Send Test Message"<br>
            3. Check your WhatsApp for the message<br>
            4. Review the result below
        </div>

        <form class="test-form" method="POST">
            <label>WhatsApp Number (with country code):</label>
            <input type="text" name="phone" value="<?php echo htmlspecialchars($testNumber); ?>" 
                   placeholder="+256703268522" required>
            
            <label>Test Message:</label>
            <input type="text" name="message" value="Test message from KIUMA notification system. If you receive this, WhatsApp integration is working!" 
                   required>
            
            <button type="submit">📱 Send Test Message</button>
        </form>

        <?php
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $phone = $_POST['phone'] ?? $testNumber;
            $message = $_POST['message'] ?? 'Test message from KIUMA notification system';
            
            echo '<div class="result">';
            echo '<h3>Test Results:</h3>';
            echo '<p><strong>To:</strong> ' . htmlspecialchars($phone) . '</p>';
            echo '<p><strong>Message:</strong> ' . htmlspecialchars($message) . '</p>';
            echo '<hr>';
            
            echo '<p><strong>Testing...</strong></p>';
            
            $result = sendWhatsApp($phone, $message);
            
            if ($result['success']) {
                echo '<div class="success">';
                echo '<h3>✅ SUCCESS!</h3>';
                echo '<p><strong>Status:</strong> ' . htmlspecialchars($result['message']) . '</p>';
                
                if (isset($result['data']['sid'])) {
                    echo '<p><strong>Twilio SID:</strong> ' . htmlspecialchars($result['data']['sid']) . '</p>';
                }
                
                if (isset($result['data']['status'])) {
                    echo '<p><strong>Message Status:</strong> ' . htmlspecialchars($result['data']['status']) . '</p>';
                }
                
                echo '<p><strong>✅ Check your WhatsApp! You should receive the message.</strong></p>';
                echo '</div>';
            } else {
                echo '<div class="error">';
                echo '<h3>❌ FAILED</h3>';
                echo '<p><strong>Error:</strong> ' . htmlspecialchars($result['message']) . '</p>';
                
                if (isset($result['data'])) {
                    echo '<p><strong>Details:</strong></p>';
                    echo '<pre>' . htmlspecialchars(json_encode($result['data'], JSON_PRETTY_PRINT)) . '</pre>';
                }
                
                echo '<p><strong>Common Issues:</strong></p>';
                echo '<ul>';
                echo '<li>Number not verified in Twilio Sandbox - Join sandbox first</li>';
                echo '<li>Wrong number format - Must include country code (+256...)</li>';
                echo '<li>Twilio credentials not configured - Check api/whatsapp_integration.php</li>';
                echo '<li>Twilio account issues - Check Twilio Console</li>';
                echo '</ul>';
                echo '</div>';
            }
            
            echo '</div>';
        }
        ?>
        
        <div class="info result" style="margin-top: 30px;">
            <strong>📚 Next Steps:</strong><br>
            • If successful, your WhatsApp integration is working!<br>
            • You can now test sending notifications to all users from the notifications page<br>
            • Check <a href="TEST_NOTIFICATIONS.md">TEST_NOTIFICATIONS.md</a> for complete testing guide
        </div>
    </div>
</body>
</html>

