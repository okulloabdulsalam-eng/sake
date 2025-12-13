<?php
/**
 * WhatsApp Integration Helper - EXAMPLE/TEMPLATE
 * 
 * This is a template file. Copy this to whatsapp_integration.php and add your credentials.
 * 
 * DO NOT commit whatsapp_integration.php to Git (it's in .gitignore)
 */

require_once __DIR__ . '/library_media_config.php';

// ============================================
// WHATSAPP SERVICE CONFIGURATION
// ============================================

// Choose your WhatsApp service: 'twilio' or 'meta'
define('WHATSAPP_SERVICE', 'twilio'); // Change to 'meta' for Meta Business API

// Twilio Configuration (if using Twilio)
define('TWILIO_ACCOUNT_SID', ''); // Your Twilio Account SID
define('TWILIO_AUTH_TOKEN', '');  // Your Twilio Auth Token
define('TWILIO_WHATSAPP_NUMBER', '+14155238886'); // Twilio WhatsApp number (default sandbox) - Use join code: planning-job

// Meta WhatsApp Business API Configuration (if using Meta)
define('META_PHONE_NUMBER_ID', ''); // Your Meta Phone Number ID
define('META_ACCESS_TOKEN', '');     // Your Meta Access Token
define('META_VERIFY_TOKEN', '');     // Your Meta Verify Token (for webhook)

// ============================================
// SEND WHATSAPP MESSAGE
// ============================================

/**
 * Send WhatsApp message using configured service
 * 
 * @param string $to Phone number (with country code, e.g., +256703268522)
 * @param string $message Message to send
 * @return array ['success' => bool, 'message' => string, 'data' => array]
 */
function sendWhatsApp($to, $message) {
    // Clean phone number
    $cleanNumber = preg_replace('/[^\d+]/', '', $to);
    
    // Ensure number starts with +
    if (!str_starts_with($cleanNumber, '+')) {
        $cleanNumber = '+' . $cleanNumber;
    }
    
    if (WHATSAPP_SERVICE === 'twilio') {
        return sendWhatsAppViaTwilio($cleanNumber, $message);
    } elseif (WHATSAPP_SERVICE === 'meta') {
        return sendWhatsAppViaMeta($cleanNumber, $message);
    } else {
        return [
            'success' => false,
            'message' => 'WhatsApp service not configured. Please set WHATSAPP_SERVICE in whatsapp_integration.php'
        ];
    }
}

// ============================================
// TWILIO WHATSAPP API
// ============================================

/**
 * Send WhatsApp message via Twilio
 */
function sendWhatsAppViaTwilio($to, $message) {
    if (empty(TWILIO_ACCOUNT_SID) || empty(TWILIO_AUTH_TOKEN)) {
        return [
            'success' => false,
            'message' => 'Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in whatsapp_integration.php'
        ];
    }
    
    $url = 'https://api.twilio.com/2010-04-01/Accounts/' . TWILIO_ACCOUNT_SID . '/Messages.json';
    
    $data = [
        'From' => 'whatsapp:' . TWILIO_WHATSAPP_NUMBER,
        'To' => 'whatsapp:' . $to,
        'Body' => $message
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERPWD, TWILIO_ACCOUNT_SID . ':' . TWILIO_AUTH_TOKEN);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $responseData = json_decode($response, true);
    
    if ($httpCode === 201 && isset($responseData['sid'])) {
        return [
            'success' => true,
            'message' => 'WhatsApp message sent successfully via Twilio',
            'data' => $responseData
        ];
    } else {
        return [
            'success' => false,
            'message' => 'Failed to send WhatsApp message via Twilio: ' . ($responseData['message'] ?? 'Unknown error'),
            'data' => $responseData
        ];
    }
}

// ============================================
// META WHATSAPP BUSINESS API
// ============================================

/**
 * Send WhatsApp message via Meta WhatsApp Business API
 */
function sendWhatsAppViaMeta($to, $message) {
    if (empty(META_PHONE_NUMBER_ID) || empty(META_ACCESS_TOKEN)) {
        return [
            'success' => false,
            'message' => 'Meta credentials not configured. Please set META_PHONE_NUMBER_ID and META_ACCESS_TOKEN in whatsapp_integration.php'
        ];
    }
    
    $url = 'https://graph.facebook.com/v18.0/' . META_PHONE_NUMBER_ID . '/messages';
    
    $data = [
        'messaging_product' => 'whatsapp',
        'to' => $to,
        'type' => 'text',
        'text' => [
            'body' => $message
        ]
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . META_ACCESS_TOKEN,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $responseData = json_decode($response, true);
    
    if ($httpCode === 200 && isset($responseData['messages'][0]['id'])) {
        return [
            'success' => true,
            'message' => 'WhatsApp message sent successfully via Meta',
            'data' => $responseData
        ];
    } else {
        return [
            'success' => false,
            'message' => 'Failed to send WhatsApp message via Meta: ' . ($responseData['error']['message'] ?? 'Unknown error'),
            'data' => $responseData
        ];
    }
}

// ============================================
// TEST FUNCTION
// ============================================

/**
 * Test WhatsApp sending (for debugging)
 * Usage: Call this function with a test number to verify setup
 */
function testWhatsAppSending($testNumber = '+256703268522') {
    $result = sendWhatsApp($testNumber, 'Test message from KIUMA notification system');
    return $result;
}

?>


