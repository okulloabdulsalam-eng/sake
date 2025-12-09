<?php
/**
 * Upload Book to Google Drive
 * Handles book file upload, Google Drive storage, and database entry
 */

require_once __DIR__ . '/library_media_config.php';
require_once __DIR__ . '/../media-storage/vendor/autoload.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get form data
$title = $_POST['title'] ?? '';
$author = $_POST['author'] ?? '';
$isbn = $_POST['isbn'] ?? '';
$category = $_POST['category'] ?? '';
$description = $_POST['description'] ?? '';
$coverImageUrl = $_POST['coverImageUrl'] ?? '';

if (empty($title) || empty($author) || empty($category)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Title, author, and category are required']);
    exit;
}

$driveFileId = null;
$directDownloadLink = null;
$bookFileName = null;
$fileSize = null;

// Handle book file upload if provided
if (isset($_FILES['bookFile']) && $_FILES['bookFile']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['bookFile'];
    $fileName = $file['name'];
    $fileTmpPath = $file['tmp_name'];
    $fileSize = $file['size'];
    $fileType = $file['type'];
    
    // Validate file size
    if ($fileSize > MAX_FILE_SIZE) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'File size exceeds maximum allowed size']);
        exit;
    }
    
    // Validate MIME type
    if (!isAllowedBookType($fileType)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'File type not allowed. Allowed: PDF, DOC, DOCX, EPUB, TXT']);
        exit;
    }
    
    try {
        // Initialize Google Drive API Client
        $client = new Google_Client();
        $client->setAuthConfig(GOOGLE_CREDENTIALS_PATH);
        $client->addScope(Google_Service_Drive::DRIVE_FILE);
        $client->setAccessType('offline');
        
        $accessToken = getAccessToken($client);
        $client->setAccessToken($accessToken);
        
        $driveService = new Google_Service_Drive($client);
        
        // Prepare file metadata
        $fileMetadata = new Google_Service_Drive_DriveFile([
            'name' => $fileName
        ]);
        
        if (!empty(GOOGLE_DRIVE_LIBRARY_FOLDER_ID)) {
            $fileMetadata->setParents([GOOGLE_DRIVE_LIBRARY_FOLDER_ID]);
        }
        
        // Upload to Google Drive
        $content = file_get_contents($fileTmpPath);
        $uploadedFile = $driveService->files->create(
            $fileMetadata,
            [
                'data' => $content,
                'mimeType' => $fileType,
                'uploadType' => 'multipart',
                'fields' => 'id, name'
            ]
        );
        
        $driveFileId = $uploadedFile->getId();
        $directDownloadLink = 'https://drive.google.com/uc?export=download&id=' . $driveFileId;
        $bookFileName = $fileName;
    } catch (Exception $e) {
        error_log("Google Drive upload error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error uploading to Google Drive: ' . $e->getMessage()]);
        exit;
    }
}

// Store in database
try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("
        INSERT INTO library_books (title, author, isbn, category, description, cover_image_url, book_file_name, drive_file_id, direct_download_link, file_size, uploaded_by)
        VALUES (:title, :author, :isbn, :category, :description, :cover_image_url, :book_file_name, :drive_file_id, :direct_download_link, :file_size, :uploaded_by)
    ");
    
    $uploadedBy = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
    
    $stmt->execute([
        ':title' => $title,
        ':author' => $author,
        ':isbn' => $isbn ?: null,
        ':category' => $category,
        ':description' => $description ?: null,
        ':cover_image_url' => $coverImageUrl ?: null,
        ':book_file_name' => $bookFileName,
        ':drive_file_id' => $driveFileId,
        ':direct_download_link' => $directDownloadLink,
        ':file_size' => $fileSize,
        ':uploaded_by' => $uploadedBy
    ]);
    
    $bookId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Book added successfully',
        'book_id' => $bookId,
        'download_link' => $directDownloadLink
    ]);
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}

?>

