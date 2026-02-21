<?php
/**
 * CLI Test for WhatsApp Notifications
 * Run: php run_whatsapp_test.php
 */

require_once __DIR__ . '/api/library_media_config.php';
require_once __DIR__ . '/api/whatsapp_integration.php';

echo "========================================\n";
echo "WhatsApp Notification Test\n";
echo "========================================\n\n";

// Step 1: Check Configuration
echo "[1] Checking Configuration...\n";
$configOk = true;

if (!defined('TWILIO_ACCOUNT_SID') || empty(TWILIO_ACCOUNT_SID)) {
    echo "  ❌ TWILIO_ACCOUNT_SID not configured\n";
    $configOk = false;
} else {
    echo "  ✅ TWILIO_ACCOUNT_SID: " . substr(TWILIO_ACCOUNT_SID, 0, 10) . "...\n";
}

if (!defined('TWILIO_AUTH_TOKEN') || empty(TWILIO_AUTH_TOKEN)) {
    echo "  ❌ TWILIO_AUTH_TOKEN not configured\n";
    $configOk = false;
} else {
    echo "  ✅ TWILIO_AUTH_TOKEN: Configured\n";
}

if (!defined('TWILIO_WHATSAPP_NUMBER') || empty(TWILIO_WHATSAPP_NUMBER)) {
    echo "  ❌ TWILIO_WHATSAPP_NUMBER not configured\n";
    $configOk = false;
} else {
    echo "  ✅ TWILIO_WHATSAPP_NUMBER: " . TWILIO_WHATSAPP_NUMBER . "\n";
}

if (!$configOk) {
    echo "\n❌ Configuration incomplete. Please check api/whatsapp_integration.php\n";
    exit(1);
}

// Step 2: Check Database and Users
echo "\n[2] Checking Database Users...\n";
try {
    $pdo = getDBConnection();
    $stmt = $pdo->query("
        SELECT id, whatsapp, firstName, lastName, name 
        FROM users 
        WHERE whatsapp IS NOT NULL AND whatsapp != ''
        ORDER BY id DESC
        LIMIT 5
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($users)) {
        echo "  ⚠️  No users with WhatsApp numbers found in database\n";
        echo "  💡 Using default test number: +256703268522\n";
        $testNumbers = ['+256703268522'];
    } else {
        echo "  ✅ Found " . count($users) . " user(s) with WhatsApp numbers:\n";
        $testNumbers = [];
        foreach ($users as $user) {
            $name = $user['name'] ?? ($user['firstName'] . ' ' . $user['lastName']);
            $whatsapp = $user['whatsapp'];
            echo "     - " . htmlspecialchars($name) . ": " . htmlspecialchars($whatsapp) . "\n";
            $testNumbers[] = $whatsapp;
        }
    }
} catch (Exception $e) {
    echo "  ❌ Database error: " . $e->getMessage() . "\n";
    echo "  💡 Using default test number: +256703268522\n";
    $testNumbers = ['+256703268522'];
}

// Step 3: Send Test Message
echo "\n[3] Sending Test Message...\n";
$testMessage = "🧪 Test Notification from KIUMA\n\nThis is a test message to verify WhatsApp notifications are working!\n\nTime: " . date('Y-m-d H:i:s');

$successCount = 0;
$failCount = 0;

foreach ($testNumbers as $number) {
    echo "\n  📤 Sending to: $number\n";
    
    $result = sendWhatsApp($number, $testMessage);
    
    if ($result['success']) {
        echo "     ✅ SUCCESS! Message sent successfully\n";
        echo "     Message: " . $result['message'] . "\n";
        if (isset($result['data']['sid'])) {
            echo "     Twilio SID: " . $result['data']['sid'] . "\n";
        }
        $successCount++;
    } else {
        echo "     ❌ FAILED\n";
        echo "     Error: " . $result['message'] . "\n";
        if (isset($result['data'])) {
            echo "     Details: " . json_encode($result['data'], JSON_PRETTY_PRINT) . "\n";
        }
        $failCount++;
    }
    
    // Small delay between sends
    if (count($testNumbers) > 1) {
        sleep(1);
    }
}

// Step 4: Summary
echo "\n========================================\n";
echo "Test Results Summary\n";
echo "========================================\n";
echo "✅ Successfully sent: $successCount\n";
echo "❌ Failed: $failCount\n";

if ($successCount > 0) {
    echo "\n🎉 SUCCESS! Check WhatsApp on the recipient number(s) to verify!\n";
} else {
    echo "\n⚠️  No messages were sent successfully.\n";
    echo "\nCommon issues:\n";
    echo "1. Number not verified in Twilio WhatsApp sandbox\n";
    echo "2. Number format incorrect (must include country code like +256...)\n";
    echo "3. Twilio credentials incorrect\n";
    echo "4. Twilio account limitations\n";
    echo "\nTo join Twilio sandbox, send 'join [code]' to +14155238886\n";
    echo "Get code from: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn\n";
}

echo "\n";

