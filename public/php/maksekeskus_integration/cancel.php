<?php
// public/php/maksekeskus_integration/cancel.php

// Set headers for JSON response
header('Content-Type: application/json');

// Enable error reporting for debugging (disable in production)
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

// Load environment variables
$env_file = __DIR__ . '/../../../.env';
if (file_exists($env_file)) {
    $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Load Maksekeskus SDK
require_once __DIR__ . '/../maksekeskus/lib/Maksekeskus.php';
require_once __DIR__ . '/../maksekeskus/vendor/autoload.php';

try {
    // Initialize Maksekeskus client
    $shopId = $_ENV['MAKSEKESKUS_SHOP_ID'] ?? '';
    $publishableKey = $_ENV['MAKSEKESKUS_PUBLISHABLE_KEY'] ?? '';
    $secretKey = $_ENV['MAKSEKESKUS_SECRET_KEY'] ?? '';
    $testMode = isset($_ENV['MAKSEKESKUS_TEST_MODE']) && $_ENV['MAKSEKESKUS_TEST_MODE'] === 'true';
    
    if (!$shopId || !$secretKey) {
        throw new Exception('Maksekeskus configuration is missing');
    }
    
    $client = new \Maksekeskus\Maksekeskus($shopId, $publishableKey, $secretKey, $testMode);
    
    // Get request data
    $requestData = $_REQUEST;
    
    // Verify the request
    if (!$client->verifyMac($requestData)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid signature']);
        exit;
    }
    
    // Extract message data
    $messageData = $client->extractRequestData($requestData);
    
    // Return cancel response with transaction data
    echo json_encode([
        'success' => false,
        'cancelled' => true,
        'transaction' => [
            'id' => $messageData['transaction'] ?? null,
            'reference' => $messageData['reference'] ?? null,
            'status' => $messageData['status'] ?? null
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Cancel handler failed: ' . $e->getMessage()
    ]);
}