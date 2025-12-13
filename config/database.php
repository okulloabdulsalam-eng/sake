<?php
/**
 * KIUMA Database Configuration
 * Configured for XAMPP
 * 
 * IMPORTANT: Update the values below with your actual credentials
 */

// ============================================
// DATABASE CONFIGURATION (XAMPP Defaults)
// ============================================
define('DB_HOST', 'localhost');        // XAMPP default MySQL host
define('DB_USER', 'root');             // XAMPP default MySQL username
define('DB_PASS', '');                 // XAMPP default password (usually empty)
define('DB_NAME', 'kiuma_main'); // Your database name

// ============================================
// EMAIL CONFIGURATION
// ============================================
// Email address to receive notifications
define('EMAIL_TO', 'aworshibah2006@gmail.com');

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
// Get this from Twilio Console after setting up WhatsApp Sandbox
define('WHATSAPP_FROM', ''); // Example: 'whatsapp:+14155238886'

// Twilio Account SID (starts with AC...)
// Get from: https://console.twilio.com/
define('TWILIO_ACCOUNT_SID', ''); // Example: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

// Twilio Auth Token
// Get from: https://console.twilio.com/
define('TWILIO_AUTH_TOKEN', ''); // Your auth token here

// ============================================
// SMTP CONFIGURATION (Optional - for reliable email)
// ============================================
// Leave empty to use PHP mail() function, or configure SMTP for better reliability

// SMTP Host (Gmail example)
define('SMTP_HOST', 'smtp.gmail.com');

// SMTP Port
define('SMTP_PORT', 587);

// SMTP Username (your email address)
define('SMTP_USERNAME', ''); // Example: 'your-email@gmail.com'

// SMTP Password (use App Password for Gmail)
// For Gmail: Enable 2FA, then create App Password at:
// https://myaccount.google.com/apppasswords
define('SMTP_PASSWORD', ''); // Your email password or app password

// SMTP Encryption ('tls' or 'ssl')
define('SMTP_ENCRYPTION', 'tls');

// ============================================
// DATABASE CONNECTION FUNCTION
// ============================================
/**
 * Get database connection using PDO
 * @return PDO Database connection object
 */
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

// ============================================
// SETUP INSTRUCTIONS FOR XAMPP
// ============================================
/*
 * STEP 1: Create Database
 * -----------------------
 * 1. Open phpMyAdmin: http://localhost/phpmyadmin
 * 2. Click "New" to create a new database
 * 3. Name it: kiuma_recruitment
 * 4. Collation: utf8mb4_unicode_ci
 * 5. Click "Create"
 * 
 * STEP 2: Import Database Schema
 * -------------------------------
 * 1. In phpMyAdmin, select the kiuma_recruitment database
 * 2. Click "Import" tab
 * 3. Choose file: database/schema.sql
 * 4. Click "Go"
 * 
 * STEP 3: Configure This File
 * ---------------------------
 * 1. Update DB_PASS if you set a MySQL password in XAMPP
 * 2. Update EMAIL_TO with your email address
 * 3. (Optional) Configure SMTP for email
 * 4. (Optional) Configure Twilio for WhatsApp
 * 
 * STEP 4: Test Database Connection
 * --------------------------------
 * 1. Open: http://localhost/your-project/test_db.php
 * 2. Should see: "Database connection successful!"
 * 
 * STEP 5: Test Form
 * -----------------
 * 1. Open: http://localhost/your-project/api/join_us_form.php
 * 2. Fill out and submit the form
 * 3. Check database for new record
 */

?>
