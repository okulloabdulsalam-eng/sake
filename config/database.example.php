<?php
/**
 * KIUMA Database Configuration - EXAMPLE FILE
 * 
 * Copy this file to database.php and update with your actual credentials
 * 
 * IMPORTANT: database.php is in .gitignore and will NOT be committed
 */

// ============================================
// DATABASE CONFIGURATION (XAMPP Defaults)
// ============================================
define('DB_HOST', 'localhost');        // XAMPP default MySQL host
define('DB_USER', 'root');             // XAMPP default MySQL username
define('DB_PASS', '');                 // XAMPP default password (usually empty)
define('DB_NAME', 'kiuma_recruitment'); // Your database name

// ============================================
// EMAIL CONFIGURATION
// ============================================
// Email address to receive notifications
define('EMAIL_TO', 'your-email@gmail.com');

// Email address to send from (use your domain email if available)
define('EMAIL_FROM', 'noreply@kiuma.org');

// Email subject for notifications
define('EMAIL_SUBJECT', 'New Recruit Joined - KIUMA');

// ============================================
// WHATSAPP CONFIGURATION (Twilio)
// ============================================
// WhatsApp number to receive notifications (include country code)
define('WHATSAPP_TO', '+256703268522');

// Your Twilio WhatsApp number (format: whatsapp:+14155238886)
define('WHATSAPP_FROM', ''); // Example: 'whatsapp:+14155238886'

// Twilio Account SID (starts with AC...)
define('TWILIO_ACCOUNT_SID', ''); // Example: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

// Twilio Auth Token
define('TWILIO_AUTH_TOKEN', ''); // Your auth token here

// ============================================
// SMTP CONFIGURATION (Optional - for reliable email)
// ============================================
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', ''); // Example: 'your-email@gmail.com'
define('SMTP_PASSWORD', ''); // Your email password or app password
define('SMTP_ENCRYPTION', 'tls');

// ============================================
// DATABASE CONNECTION FUNCTION
// ============================================
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection error: " . $e->getMessage());
        die("Database connection failed. Please check your configuration in config/database.php");
    }
}
?>

