<?php
require_once 'C:/xampp/htdocs/android_api/db.php';

echo "=== PHASE 2 MIGRATION: ADDING REQUEST_ID TO STUDENT_DOCUMENTS ===\n\n";

try {
    // 1. Add request_id column to student_documents
    $pdo->exec("ALTER TABLE student_documents ADD COLUMN IF NOT EXISTS request_id INT NULL REFERENCES student_requests(id) ON DELETE SET NULL;");
    echo "[1] Schema Migration: request_id column added to student_documents table.\n";

    // 2. Add index for request_id queries
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_documents_request_id ON student_documents(request_id);");
    echo "[2] Schema Migration: idx_documents_request_id index created successfully.\n\n";

    echo "=== PHASE 2 MIGRATION COMPLETED SUCCESSFULLY ===\n";
} catch (Exception $e) {
    echo "Migration error: " . $e->getMessage() . "\n";
}
