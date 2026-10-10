<?php
require_once 'C:/xampp/htdocs/android_api/db.php';

echo "=== MIGRATING SERVICE TYPES REQUIREMENTS IN POSTGRESQL ===\n\n";

try {
    // 1. Add requirements column if not exists
    $pdo->exec("ALTER TABLE service_types ADD COLUMN IF NOT EXISTS requirements TEXT;");
    echo "[1] Schema Migration: requirements column ensured in service_types table.\n";

    // 2. Structured Requirements JSON for Good Moral
    $goodMoralReqs = json_encode([
        [
            "name" => "Valid Identification",
            "description" => "Student ID, Alumni ID, or Government-issued ID.",
            "required" => true,
            "conditional" => false
        ],
        [
            "name" => "Clearance / Request Form",
            "description" => "Filled-out form from Guidance, Registrar, or Student Affairs office.",
            "required" => true,
            "conditional" => false
        ],
        [
            "name" => "Proof of Payment",
            "description" => "Official receipt for processing fee.",
            "required" => true,
            "conditional" => false
        ],
        [
            "name" => "Documentary Stamps",
            "description" => "May be required upon claiming, depending on the applicable process.",
            "required" => false,
            "conditional" => true
        ]
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

    // 3. Structured Requirements JSON for TUR / TOR (Transcript of Records)
    $torReqs = json_encode([
        [
            "name" => "ID Pictures",
            "description" => "Two recent 2x2 or 1x1 passport-sized colored photos with white background, if required by the process.",
            "required" => false,
            "conditional" => true
        ],
        [
            "name" => "Payment Receipt",
            "description" => "Official receipt for processing fee per copy.",
            "required" => true,
            "conditional" => false
        ],
        [
            "name" => "Valid Identification",
            "description" => "Old Student ID or Government-issued ID.",
            "required" => true,
            "conditional" => false
        ],
        [
            "name" => "Fully Signed University Clearance",
            "description" => "Student must have no outstanding financial, academic, or library obligations.",
            "required" => true,
            "conditional" => false
        ]
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

    // 4. Structured Requirements JSON for COC (Certificate of Completion)
    $cocReqs = json_encode([
        [
            "name" => "NDA from Department",
            "description" => "Signed Non-Disclosure Agreement from applicable department.",
            "required" => true,
            "conditional" => false
        ],
        [
            "name" => "DTR (Daily Time Record)",
            "description" => "Required hours depend on the applicable scholarship.",
            "required" => true,
            "conditional" => false
        ],
        [
            "name" => "Last Semester COC",
            "description" => "Certificate of Completion from previous semester.",
            "required" => true,
            "conditional" => false
        ],
        [
            "name" => "Current Deployment Form",
            "description" => "Validated department deployment form.",
            "required" => true,
            "conditional" => false
        ],
        [
            "name" => "ORF (Study Load)",
            "description" => "Official Registration Form showing current study load.",
            "required" => true,
            "conditional" => false
        ]
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

    // 5. Structured Requirements JSON for Lost ID Replacement
    $lostIdReqs = json_encode([
        [
            "name" => "Affidavit of Loss",
            "description" => "Notarized Affidavit of Loss stating missing student RFID smart card.",
            "required" => true,
            "conditional" => false
        ],
        [
            "name" => "Payment Receipt",
            "description" => "Official receipt of payment for replacement fee (₱150).",
            "required" => true,
            "conditional" => false
        ],
        [
            "name" => "Current Certificate of Registration (COR)",
            "description" => "Validated Certificate of Registration.",
            "required" => true,
            "conditional" => false
        ]
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

    // Update GOOD_MORAL
    $stmt1 = $pdo->prepare("UPDATE service_types SET requirements = ? WHERE service_code = 'GOOD_MORAL'");
    $stmt1->execute([$goodMoralReqs]);

    // Update COC
    $stmt2 = $pdo->prepare("UPDATE service_types SET requirements = ? WHERE service_code = 'COC'");
    $stmt2->execute([$cocReqs]);

    // Update LOST_ID
    $stmt3 = $pdo->prepare("UPDATE service_types SET requirements = ? WHERE service_code = 'LOST_ID'");
    $stmt3->execute([$lostIdReqs]);

    // Ensure TOR / TUR service row exists
    $stmtCheckTor = $pdo->prepare("SELECT id FROM service_types WHERE service_code = 'TOR'");
    $stmtCheckTor->execute();
    if (!$stmtCheckTor->fetch()) {
        $stmtTorIns = $pdo->prepare("INSERT INTO service_types (service_code, service_name, description, department, category, processing_days, fee_amount, is_active, requirements, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, ?, NOW())");
        $stmtTorIns->execute([
            'TOR',
            'Official Transcript of Records (TUR / TOR)',
            'Official academic transcript of records verifying completed grades, units, and graduation status.',
            'Academic Registrar',
            'Document',
            '3–5 Business Days',
            '₱250',
            $torReqs
        ]);
        echo "[2] Inserted Master Service Type: Official Transcript of Records (TOR).\n";
    } else {
        $stmtTorUpd = $pdo->prepare("UPDATE service_types SET requirements = ? WHERE service_code = 'TOR'");
        $stmtTorUpd->execute([$torReqs]);
        echo "[2] Updated Master Service Type: Official Transcript of Records (TOR).\n";
    }

    echo "[3] Seeded requirements JSON for GOOD_MORAL, COC, LOST_ID, and TOR successfully.\n\n";

} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
