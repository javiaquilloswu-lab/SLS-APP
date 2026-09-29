<?php
/**
 * Automated Security & Authorization Test Suite
 * Tests Student A vs Student B isolation across all endpoints.
 */

$apiBase = 'http://localhost:8080/android_api';

function makeRequest($endpoint, $method = 'GET', $payload = null, $token = null) {
    global $apiBase;
    $url = $apiBase . '/' . $endpoint;
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $headers = ['Accept: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if (is_array($payload)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            $headers[] = 'Content-Type: application/json';
        } else {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        }
    }

    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);

    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['code' => $code, 'body' => json_decode($res, true)];
}

echo "--- RUNNING SECURITY & AUTHORIZATION SUITE ---\n\n";

// 1. Test unauthenticated request
$unauth = makeRequest('get_student.php');
echo "[1] Unauthenticated GET get_student.php: Code {$unauth['code']} - " . ($unauth['code'] === 401 ? 'PASS (401 Unauthorized)' : 'FAIL') . "\n";

// 2. Test invalid Bearer token
$invalidToken = makeRequest('get_student.php', 'GET', null, 'invalid_token_12345');
echo "[2] Invalid Bearer token GET get_student.php: Code {$invalidToken['code']} - " . ($invalidToken['code'] === 401 ? 'PASS (401 Unauthorized)' : 'FAIL') . "\n";

// 3. Login Student A (2024-08912 / student123)
$loginA = makeRequest('login.php', 'POST', ['student_id' => '2024-08912', 'password' => 'student123']);
$tokenA = $loginA['body']['data']['token'] ?? null;
echo "[3] Login Student A (2024-08912): Code {$loginA['code']} - " . ($tokenA ? 'PASS (Token Acquired)' : 'FAIL') . "\n";

// 4. Login Student B (2023-00456 / student123)
$loginB = makeRequest('login.php', 'POST', ['student_id' => '2023-00456', 'password' => 'student123']);
$tokenB = $loginB['body']['data']['token'] ?? null;
echo "[4] Login Student B (2023-00456): Code {$loginB['code']} - " . ($tokenB ? 'PASS (Token Acquired)' : 'FAIL') . "\n";

// 5. Test IDOR: Student B attempts to query Student A profile via parameter
$idorProfile = makeRequest('get_student.php?student_id=2024-08912', 'GET', null, $tokenB);
echo "[5] IDOR Test (Student B requests Student A profile via param): Code {$idorProfile['code']} - " . ($idorProfile['code'] === 403 ? 'PASS (403 Forbidden)' : 'FAIL') . "\n";

// 6. Test Student Token against Admin Endpoint
$adminAccess = makeRequest('admin_students.php', 'GET', null, $tokenA);
echo "[6] Student Token on Admin Endpoint (admin_students.php): Code {$adminAccess['code']} - " . ($adminAccess['code'] === 403 ? 'PASS (403 Forbidden)' : 'FAIL') . "\n";

// 7. Test Student Profile Protected Field Tampering (Attempting to change course or year_level via profile update)
$tamperProfile = makeRequest('get_student.php', 'POST', ['first_name' => 'Maria', 'course' => 'BS Nursing', 'academic_status' => 'Graduated'], $tokenA);
$courseAfter = $tamperProfile['body']['data']['course'] ?? '';
echo "[7] Profile Tampering (Attempt to change course/academic_status): Returned course '{$courseAfter}' - " . ($courseAfter === 'BS Computer Science' ? 'PASS (System fields ignored)' : 'FAIL') . "\n";

echo "\n--- SECURITY SUITE COMPLETE ---\n";
