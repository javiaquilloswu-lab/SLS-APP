<?php
require_once 'C:/xampp/htdocs/android_api/db.php';

try {
    $countStmt = $pdo->query("SELECT COUNT(*) FROM students");
    $totalCount = (int)$countStmt->fetchColumn();
    echo "Total Students in PostgreSQL: {$totalCount}\n";

    if ($totalCount > 0) {
        $stmt = $pdo->query("SELECT id, student_id, first_name, last_name, email, course, academic_status FROM students ORDER BY id DESC LIMIT 5");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "Sample Records:\n";
        print_r($rows);
    }
} catch (Exception $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
}
