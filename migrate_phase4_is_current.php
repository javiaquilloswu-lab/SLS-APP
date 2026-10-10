<?php
require_once 'C:/xampp/htdocs/android_api/db.php';

echo "=== PHASE 4 MIGRATION: ADDING IS_CURRENT TO STUDENT_DOCUMENTS ===\n\n";

try {
    // 1. Add is_current column if not exists
    $pdo->exec("ALTER TABLE student_documents ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT TRUE;");
    echo "[1] Schema Migration: is_current column added to student_documents table.\n";

    // 2. Add index for query performance
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_documents_is_current ON student_documents(is_current);");
    echo "[2] Schema Migration: idx_documents_is_current index created successfully.\n\n";

    echo "=== PHASE 4 MIGRATION COMPLETED SUCCESSFULLY ===\n";
} catch (Exception $e) {
    echo "Migration error: " . $e->getMessage() . "\n";
}
