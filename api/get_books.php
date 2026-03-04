<?php
/**
 * Get all books from database
 * Returns books with download_url for frontend compatibility
 */

require_once __DIR__ . '/library_media_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $pdo = getDBConnection();
    $category = $_GET['category'] ?? null;
    
    $sql = "SELECT id, title, author, isbn, category, description, cover_image_url, 
                   book_file_name, drive_file_id, direct_download_link, file_size, 
                   uploaded_date, uploaded_by 
            FROM library_books ORDER BY uploaded_date DESC";
    $params = [];
    
    if ($category && $category !== 'all') {
        $sql = "SELECT id, title, author, isbn, category, description, cover_image_url, 
                       book_file_name, drive_file_id, direct_download_link, file_size, 
                       uploaded_date, uploaded_by 
                FROM library_books WHERE category = :category ORDER BY uploaded_date DESC";
        $params[':category'] = $category;
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $books = $stmt->fetchAll();
    
    // Map direct_download_link to download_url for frontend compatibility
    $books = array_map(function($book) {
        $book['download_url'] = $book['direct_download_link'];
        $book['cover_url'] = $book['cover_image_url'];
        return $book;
    }, $books);
    
    echo json_encode([
        'success' => true,
        'books' => $books
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

?>

