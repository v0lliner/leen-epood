<?php
// public/php/maksekeskus_integration/success.php

// Set headers for JSON response
header('Content-Type: application/json');

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Load Supabase configuration helper
require_once __DIR__ . '/supabase_config.php';

// Load Maksekeskus SDK
require_once __DIR__ . '/../maksekeskus/lib/Maksekeskus.php';
require_once __DIR__ . '/../maksekeskus/vendor/autoload.php';

try {
    // Get Maksekeskus configuration from Supabase
    $config = getMaksekeskusConfig();
    
    $shopId = $config['shop_id'] ?? '';
    $publishableKey = $config['api_open_key'] ?? '';
    $secretKey = $config['api_secret_key'] ?? '';
    $testMode = $config['test_mode'] ?? false;
    
    if (!$shopId || !$secretKey) {
        throw new Exception('Maksekeskus configuration is missing');
    }
    
    // Log configuration for debugging
    error_log('Maksekeskus success config: ' . json_encode([
        'shopId' => $shopId,
        'testMode' => $testMode ? 'true' : 'false'
    ]));
    
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
    
    // Return success response with transaction data
    echo json_encode([
        'success' => true,
        'transaction' => [
            'id' => $messageData['transaction'] ?? null,
            'reference' => $messageData['reference'] ?? null,
            'status' => $messageData['status'] ?? null,
            'amount' => $messageData['amount'] ?? null
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Success handler failed: ' . $e->getMessage()
    ]);
}