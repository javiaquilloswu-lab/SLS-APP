<?php
$ch = curl_init('http://localhost:8080/android_api/admin_login.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['username' => 'admin', 'password' => 'admin123']));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$loginRes = json_decode(curl_exec($ch), true);
curl_close($ch);

$token = $loginRes['data']['token'] ?? null;
echo "Admin Token: " . ($token ? "Acquired" : "FAILED") . "\n";

$ch2 = curl_init('http://localhost:8080/android_api/admin_students.php?page=1&limit=20');
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Authorization: Bearer ' . $token
]);
$rawResponse = curl_exec($ch2);
$httpCode = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
curl_close($ch2);

echo "HTTP Code: {$httpCode}\n";
echo "Raw JSON Response:\n{$rawResponse}\n";
