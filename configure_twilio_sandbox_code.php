<?php
/**
 * Configure Twilio Sandbox Join Code
 * Set the join code so users can automatically join WhatsApp notifications
 */

header('Content-Type: text/html; charset=utf-8');

$code = $_GET['code'] ?? '';
$save = isset($_GET['save']) && $save === 'yes';

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Configure Twilio Sandbox Code</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
        }
        .success {
            color: #27ae60;
            padding: 10px;
            background: #d5f4e6;
            border-left: 4px solid #27ae60;
            margin: 10px 0;
        }
        .info {
            color: #3498db;
            padding: 10px;
            background: #ebf5fb;
            border-left: 4px solid #3498db;
            margin: 10px 0;
        }
        input {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
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
    </style>
</head>
<body>
    <div class="container">
        <h1>⚙️ Configure Twilio Sandbox Join Code</h1>
        
        <?php
        if ($save && !empty($code)) {
            // This would typically be saved to a config file or database
            // For now, we'll show JavaScript code to add to the page
            echo "<div class='success'>✅ Join code configured!</div>";
            echo "<div class='info'>";
            echo "<strong>Your Join Code:</strong> $code<br>";
            echo "<strong>Next Steps:</strong><br>";
            echo "1. Add this JavaScript to your page:<br>";
            echo "<pre style='background:#f0f0f0;padding:10px;border-radius:5px;overflow-x:auto;'>";
            echo "localStorage.setItem('twilioSandboxCode', '$code');";
            echo "</pre>";
            echo "2. Or update script.js directly with the join code<br>";
            echo "</div>";
            
            echo "<div class='info' style='margin-top:20px;'>";
            echo "<strong>WhatsApp Join Link:</strong><br>";
            $joinMessage = "join $code";
            $whatsappUrl = "https://wa.me/14155238886?text=" . urlencode($joinMessage);
            echo "<a href='$whatsappUrl' target='_blank'>$whatsappUrl</a>";
            echo "</div>";
        } else {
            ?>
            <div class="info">
                <strong>Get Your Twilio Sandbox Join Code:</strong>
                <ol>
                    <li>Go to: <a href="https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn" target="_blank">Twilio Console → WhatsApp Sandbox</a></li>
                    <li>Find your <strong>Join Code</strong> (e.g., "join hello-moon")</li>
                    <li>Enter it below</li>
                </ol>
            </div>
            
            <form method="GET">
                <label><strong>Twilio Sandbox Join Code:</strong></label>
                <input type="text" name="code" placeholder="e.g., hello-moon" required>
                <input type="hidden" name="save" value="yes">
                <button type="submit">💾 Save Join Code</button>
            </form>
            
            <div class="info" style="margin-top:20px;">
                <strong>Why This Is Needed:</strong><br>
                After registration, users need to join the WhatsApp sandbox to receive notifications. 
                By setting the join code here, the registration success page can automatically show 
                users a pre-filled WhatsApp link to join.
            </div>
            <?php
        }
        ?>
        
        <hr>
        <p><small><a href="test_send_whatsapp_notifications.php">← Back to Tests</a></small></p>
    </div>
</body>
</html>

