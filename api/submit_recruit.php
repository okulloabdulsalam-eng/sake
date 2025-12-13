<?php
/**
 * KIUMA Recruitment Form Submission Handler
 * Handles form submission, database insertion, and email notifications
 */

require_once __DIR__ . '/../config/database.php';

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get and validate input data
$fullname = isset($_POST['fullname']) ? trim($_POST['fullname']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$role = isset($_POST['role']) ? trim($_POST['role']) : '';

// Validation
$errors = [];

if (empty($fullname)) {
    $errors[] = 'Full name is required';
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Valid email is required';
}

if (empty($phone)) {
    $errors[] = 'Phone number is required';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => implode(', ', $errors)]);
    exit;
}

try {
    // Connect to database
    $pdo = getDBConnection();
    
    // Prepare insert statement
    $stmt = $pdo->prepare("
        INSERT INTO recruits (fullname, email, phone, role, date_joined) 
        VALUES (:fullname, :email, :phone, :role, NOW())
    ");
    
    // Execute insert
    $stmt->execute([
        ':fullname' => $fullname,
        ':email' => $email,
        ':phone' => $phone,
        ':role' => $role ?: null
    ]);
    
    // Get the inserted record ID
    $recruitId = $pdo->lastInsertId();
    
    // Get the full record
    $stmt = $pdo->prepare("SELECT * FROM recruits WHERE id = :id");
    $stmt->execute([':id' => $recruitId]);
    $recruit = $stmt->fetch();
    
    // Send email notification
    $emailSent = sendEmailNotification($recruit);
    
    // Return success response
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for joining KIUMA! Your registration was successful.',
        'data' => [
            'id' => $recruitId,
            'fullname' => $recruit['fullname'],
            'email' => $recruit['email'],
            'phone' => $recruit['phone'],
            'role' => $recruit['role'],
            'date_joined' => $recruit['date_joined']
        ],
        'notifications' => [
            'email' => $emailSent
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while processing your request. Please try again later.'
    ]);
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred. Please try again later.'
    ]);
}

/**
 * Send email notification
 */
function sendEmailNotification($recruit) {
    try {
        $to = EMAIL_TO;
        $subject = EMAIL_SUBJECT;
        
        $message = "New Recruit Joined - KIUMA\n\n";
        $message .= "Full Name: " . $recruit['fullname'] . "\n";
        $message .= "Phone: " . $recruit['phone'] . "\n";
        $message .= "Email: " . $recruit['email'] . "\n";
        $message .= "Role: " . ($recruit['role'] ?: 'Not specified') . "\n";
        $message .= "Date Joined: " . $recruit['date_joined'] . "\n";
        $message .= "\n---\nKIUMA Recruitment System";
        
        $headers = "From: " . EMAIL_FROM . "\r\n";
        $headers .= "Reply-To: " . EMAIL_FROM . "\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();
        
        // Try SMTP first if configured, otherwise use mail()
        if (!empty(SMTP_USERNAME) && !empty(SMTP_PASSWORD)) {
            return sendEmailViaSMTP($to, $subject, $message);
        } else {
            return mail($to, $subject, $message, $headers);
        }
    } catch (Exception $e) {
        error_log("Email send error: " . $e->getMessage());
        return false;
    }
}

/**
 * Send email via SMTP using PHPMailer (if available) or native mail()
 */
function sendEmailViaSMTP($to, $subject, $message) {
    // Check if PHPMailer is available
    if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        require_once __DIR__ . '/../vendor/autoload.php';
        
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        
        try {
            // SMTP configuration
            $mail->isSMTP();
            $mail->Host = SMTP_HOST;
            $mail->SMTPAuth = true;
            $mail->Username = SMTP_USERNAME;
            $mail->Password = SMTP_PASSWORD;
            $mail->SMTPSecure = SMTP_ENCRYPTION;
            $mail->Port = SMTP_PORT;
            $mail->CharSet = 'UTF-8';
            
            // Recipients
            $mail->setFrom(EMAIL_FROM, 'KIUMA Recruitment');
            $mail->addAddress($to);
            
            // Content
            $mail->isHTML(false);
            $mail->Subject = $subject;
            $mail->Body = $message;
            
            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("PHPMailer error: " . $mail->ErrorInfo);
            return false;
        }
    } else {
        // Fallback to native mail() function
        $headers = "From: " . EMAIL_FROM . "\r\n";
        $headers .= "Reply-To: " . EMAIL_FROM . "\r\n";
        return mail($to, $subject, $message, $headers);
    }
}

?>

