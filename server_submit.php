<?php
// This is a server-side script to submit data to HubSpot
// It should be placed on a PHP-enabled server

// Set headers to allow cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get the JSON data from the request
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Check if required fields are present
if (!isset($data['email'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Email is required']);
    exit;
}

// Set up HubSpot submission
$portalId = '24160521';
$formId = 'a00f1f67-1490-44a7-a571-142da5377383';
$url = "https://api.hsforms.com/submissions/v3/integration/submit/{$portalId}/{$formId}";

// Prepare HubSpot data
$hubspotData = [
    'fields' => [
        [
            'name' => 'email',
            'value' => $data['email']
        ],
        [
            'name' => 'firstname',
            'value' => $data['firstname'] ?? ''
        ],
        [
            'name' => 'lastname',
            'value' => $data['lastname'] ?? ''
        ],
        [
            'name' => 'cg_needs_verification',
            'value' => 'Yes'
        ]
    ],
    'context' => [
        'pageUri' => $_SERVER['HTTP_REFERER'] ?? 'https://example.com',
        'pageName' => 'Property Listings Authentication'
    ]
];

// Send data to HubSpot
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($hubspotData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// Check for cURL errors
if ($error) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL error: ' . $error]);
    exit;
}

// Return HubSpot's response
http_response_code($httpCode);
echo $response;
?>