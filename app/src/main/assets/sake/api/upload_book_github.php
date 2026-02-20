<?php
/**
 * Upload Book Metadata (GitHub Storage Support)
 * 
 * NOTE: Files are uploaded directly to GitHub from the client.
 * This endpoint only stores metadata in the database.
 * 
 * Expected JSON payload:
 * {
 *   "title": "Book Title",
 *   "author": "Author Name",
 *   "category": "islamic|educational|quran|other",
 *   "description": "Optional description",
 *   "download_url": "https://raw.githubusercontent.com/...",
 *   "file_size": 12345,
 *   "storage_path": "library/islamic/123456_abc.pdf",
 *   "github_sha": "abc123..."
 * }
 */

require_once __DIR__ . '/library_media_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Password');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Check admin password
$password = $data['password'] ?? $_POST['password'] ?? $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
if ($password !== ADMIN_PASSWORD) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Admin password required.']);
    exit;
}

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit;
}

// Extract data from JSON
$title = $data['title'] ?? null;
$author = $data['author'] ?? '';
$category = $data['category'] ?? 'other';
$description = $data['description'] ?? null;
$downloadUrl = $data['download_url'] ?? null;
$fileSize = $data['file_size'] ?? 0;
$storagePath = $data['storage_path'] ?? null;
$githubSha = $data['github_sha'] ?? null;
$coverImageUrl = $data['cover_image_url'] ?? null;

// Validate required fields
if (!$title) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required field: title']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Check if library_books table exists, if not use books table
    $tableExists = false;
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'library_books'");
        $tableExists = $stmt->rowCount() > 0;
    } catch (Exception $e) {
        $tableExists = false;
    }
    
    if ($tableExists) {
        // Use library_books table
        $stmt = $pdo->prepare("
            INSERT INTO library_books (title, author, category, description, cover_image_url, drive_file_id, direct_download_link, file_size, uploaded_by)
            VALUES (:title, :author, :category, :description, :cover_image_url, :drive_file_id, :direct_download_link, :file_size, :uploaded_by)
        ");
        
        $stmt->execute([
            ':title' => $title,
            ':author' => $author,
            ':category' => $category,
            ':description' => $description,
            ':cover_image_url' => $coverImageUrl,
            ':drive_file_id' => $storagePath ?: $githubSha,
            ':direct_download_link' => $downloadUrl,
            ':file_size' => $fileSize,
            ':uploaded_by' => $_SERVER['REMOTE_ADDR'] ?? 'Admin'
        ]);
    } else {
        // Try books table (Supabase style)
        $stmt = $pdo->prepare("
            INSERT INTO books (title, author, category, description, cover_url, download_url, file_size, created_at)
            VALUES (:title, :author, :category, :description, :cover_url, :download_url, :file_size, NOW())
        ");
        
        $stmt->execute([
            ':title' => $title,
            ':author' => $author,
            ':category' => $category,
            ':description' => $description,
            ':cover_url' => $coverImageUrl,
            ':download_url' => $downloadUrl,
            ':file_size' => $fileSize
        ]);
    }
    
    $bookId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Book added successfully',
        'book_id' => $bookId,
        'download_url' => $downloadUrl
    ]);
    
} catch (PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}

?>
