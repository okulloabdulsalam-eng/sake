<?php
/**
 * Google Drive Authorization Helper
 * Run this once to authorize the application and get access token
 * 
 * Usage:
 * 1. Make sure credentials.json is in this directory
 * 2. Visit this file in your browser: http://localhost/media-storage/authorize.php
 * 3. Authorize and token will be saved automatically
 * 4. Delete this file after authorization (for security)
 */

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config.php';

// Check if credentials.json exists
if (!file_exists(GOOGLE_CREDENTIALS_PATH)) {
    die('<h2>Error: credentials.json not found!</h2><p>Please download your OAuth credentials from Google Cloud Console and save as <code>credentials.json</code> in this directory.</p>');
}

$client = new Google_Client();
$client->setAuthConfig(GOOGLE_CREDENTIALS_PATH);
$client->addScope(Google_Service_Drive::DRIVE_FILE);
$client->setAccessType('offline');
$client->setPrompt('select_account consent');

// Set redirect URI (update this to match your setup)
$redirectUri = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') 
    . '://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/authorize.php';
$client->setRedirectUri($redirectUri);

if (isset($_GET['code'])) {
    // Exchange authorization code for access token
    try {
        $accessToken = $client->fetchAccessTokenWithAuthCode($_GET['code']);
        
        if (array_key_exists('error', $accessToken)) {
            throw new Exception('Error: ' . $accessToken['error']);
        }
        
        $client->setAccessToken($accessToken);
        
        // Save token for future use
        $tokenPath = __DIR__ . '/token.json';
        if (!file_exists(dirname($tokenPath))) {
            mkdir(dirname($tokenPath), 0700, true);
        }
        file_put_contents($tokenPath, json_encode($client->getAccessToken()));
        
        echo '<!DOCTYPE html>
<html>
<head>
    <title>Authorization Successful</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .success { background: #d4edda; color: #155724; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .warning { background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .btn { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>✅ Authorization Successful!</h1>
    <div class="success">
        <p><strong>Token saved successfully!</strong></p>
        <p>Your access token has been saved to <code>token.json</code>. You can now use the upload system.</p>
    </div>
    <div class="warning">
        <p><strong>Security Note:</strong> For security, you should delete or rename this <code>authorize.php</code> file after authorization.</p>
    </div>
    <a href="index.html" class="btn">Go to Upload Page</a>
    <a href="dashboard.php" class="btn" style="background: #28a745;">Go to Dashboard</a>
</body>
</html>';
        
    } catch (Exception $e) {
        echo '<!DOCTYPE html>
<html>
<head>
    <title>Authorization Error</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .error { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <h1>❌ Authorization Error</h1>
    <div class="error">
        <p><strong>Error:</strong> ' . htmlspecialchars($e->getMessage()) . '</p>
        <p>Please try again or check your credentials.json file.</p>
    </div>
    <a href="authorize.php">Try Again</a>
</body>
</html>';
    }
} else {
    // Generate authorization URL
    $authUrl = $client->createAuthUrl();
    
    // Redirect to Google authorization page
    header('Location: ' . $authUrl);
    exit;
}

?>

