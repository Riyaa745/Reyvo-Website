<?php
header('Content-Type: application/json');

$baseCount = 340;
$dataDir = __DIR__ . '/data';
$countFile = $dataDir . '/count.txt';
$submissionsFile = $dataDir . '/submissions.csv';

// Paste your deployed Google Apps Script Web App URL here. It must end with /exec.
// A normal Google Sheet edit/share link will not accept form submissions.
$googleSheetWebhook = 'https://script.google.com/macros/s/AKfycby30RptoBh1PlydW3VubGriVlSQ7yThdWw6pMumkvxHv18pDVqJK3uwZEr88kozuh_cPg/exec';

if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

function read_count($countFile, $baseCount)
{
    if (!file_exists($countFile)) {
        file_put_contents($countFile, (string) $baseCount, LOCK_EX);
        return $baseCount;
    }

    $count = (int) trim(file_get_contents($countFile));
    return max($baseCount, $count);
}

function clean_value($value)
{
    return trim((string) $value);
}

function send_google_sheet($url, $payload)
{
    if ($url === '' || strpos($url, 'docs.google.com/spreadsheets') !== false || strpos($url, '/exec') === false) {
        return ['ok' => false, 'message' => 'https://script.google.com/macros/s/AKfycby30RptoBh1PlydW3VubGriVlSQ7yThdWw6pMumkvxHv18pDVqJK3uwZEr88kozuh_cPg/exec'];
    }

    $jsonPayload = json_encode($payload);
    $response = false;

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $jsonPayload,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 8,
        ]);
        $response = curl_exec($ch);
        curl_close($ch);
    }

    if ($response === false) {
        $options = [
            'http' => [
                'header' => "Content-Type: application/json\r\n",
                'method' => 'POST',
                'content' => $jsonPayload,
                'timeout' => 8,
            ],
        ];

        $response = @file_get_contents($url, false, stream_context_create($options));
    }

    if ($response === false) {
        return ['ok' => false, 'message' => 'Could not reach Google Apps Script.'];
    }

    $decoded = json_decode($response, true);
    if (is_array($decoded) && !empty($decoded['ok'])) {
        return ['ok' => true, 'message' => 'Saved to Google Sheet.'];
    }

    if (stripos($response, '<!DOCTYPE html') !== false || stripos($response, '<html') !== false) {
        return [
            'ok' => false,
            'message' => 'Google returned an HTML page. The Apps Script Web App URL is invalid, not deployed, or not accessible to Anyone.',
            'response' => substr($response, 0, 600),
        ];
    }

    return [
        'ok' => false,
        'message' => 'Google Apps Script did not return ok.',
        'response' => substr($response, 0, 600),
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['ok' => true, 'count' => read_count($countFile, $baseCount)]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
    exit;
}

$formType = clean_value($_POST['form_type'] ?? 'founding_circle');
$name = clean_value($_POST['name'] ?? '');
$email = clean_value($_POST['email'] ?? '');
$phone = clean_value($_POST['phone'] ?? '');
$contact = clean_value($_POST['contact'] ?? '');
$role = clean_value($_POST['role'] ?? '');
$message = clean_value($_POST['message'] ?? '');

if ($contact === '') {
    $contact = $email !== '' ? $email : $phone;
}

if ($name === '' || $contact === '' || $role === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Please fill all required fields.']);
    exit;
}

if ($email === '' && filter_var($contact, FILTER_VALIDATE_EMAIL)) {
    $email = $contact;
}

if ($phone === '' && $email === '') {
    $phone = $contact;
}

$createdAt = date('c');

$currentCount = read_count($countFile, $baseCount);
$newCount = $currentCount + 1;
file_put_contents($countFile, (string) $newCount, LOCK_EX);

$isNewFile = !file_exists($submissionsFile);
$csv = fopen($submissionsFile, 'a');
if ($csv) {
    if ($isNewFile) {
        fputcsv($csv, ['created_at', 'form_type', 'name', 'contact', 'email', 'phone', 'role', 'message']);
    }
    fputcsv($csv, [$createdAt, $formType, $name, $contact, $email, $phone, $role, $message]);
    fclose($csv);
}

$payload = [
    'created_at' => $createdAt,
    'form_type' => $formType,
    'name' => $name,
    'contact' => $contact,
    'email' => $email,
    'phone' => $phone,
    'role' => $role,
    'message' => $message,
    'count' => $newCount,
];

$googleSheetResult = send_google_sheet($googleSheetWebhook, $payload);

if (!$googleSheetResult['ok']) {
    http_response_code(502);
    echo json_encode([
        'ok' => false,
        'count' => $newCount,
        'google_sheet_saved' => false,
        'message' => $googleSheetResult['message'],
        'google_sheet_response' => $googleSheetResult['response'] ?? '',
    ]);
    exit;
}

echo json_encode(['ok' => true, 'count' => $newCount, 'google_sheet_saved' => true, 'google_sheet_message' => $googleSheetResult['message']]);
