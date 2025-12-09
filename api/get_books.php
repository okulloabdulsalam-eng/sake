<?php
/**
 * Get all books from database
 */

require_once __DIR__ . '/library_media_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $pdo = getDBConnection();
    $category = $_GET['category'] ?? null;
    
    $sql = "SELECT * FROM library_books ORDER BY uploaded_date DESC";
    $params = [];
    
    if ($category && $category !== 'all') {
        $sql = "SELECT * FROM library_books WHERE category = :category ORDER BY uploaded_date DESC";
        $params[':category'] = $category;
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $books = $stmt->fetchAll();
    
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

