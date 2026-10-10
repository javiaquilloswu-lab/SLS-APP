<?php
require_once 'C:/xampp/htdocs/android_api/db.php';

echo "=== PHASE 7 MIGRATION: ADDING REQUIREMENTS TO SCHOLARSHIPS ===\n\n";

try {
    // 1. Add requirements column to scholarships
    $pdo->exec("ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS requirements TEXT;");
    echo "[1] Schema Migration: requirements column added to scholarships table.\n";

    // 2. Seed default requirement templates for existing master scholarship programs if NULL
    $defaultChedReqs = json_encode([
        [
            "name" => "Certificate of Grades (COG)",
            "description" => "Certified copy of grades for the preceding academic semester.",
            "allowed_type" => "PDF/JPG/PNG",
            "required" => true,
            "display_order" => 1
        ],
        [
            "name" => "Good Moral Certificate",
            "description" => "Current certificate issued by the OSA or Registrar.",
            "allowed_type" => "PDF/JPG/PNG",
            "required" => true,
            "display_order" => 2
        ],
        [
            "name" => "Proof of Income / ITR",
            "description" => "Parents' Tax Return or Certificate of Indigency.",
            "allowed_type" => "PDF",
            "required" => true,
            "display_order" => 3
        ],
        [
            "name" => "Recommendation Letter",
            "description" => "Optional endorsement letter from department head or faculty.",
            "allowed_type" => "PDF/DOCX",
            "required" => false,
            "display_order" => 4
        ]
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

    $stmtSeed = $pdo->prepare("UPDATE scholarships SET requirements = ? WHERE requirements IS NULL OR trim(requirements) = ''");
    $stmtSeed->execute([$defaultChedReqs]);
    echo "[2] Seeded default requirement templates for existing master scholarship programs.\n\n";

    echo "=== PHASE 7 MIGRATION COMPLETED SUCCESSFULLY ===\n";
} catch (Exception $e) {
    echo "Migration error: " . $e->getMessage() . "\n";
}
