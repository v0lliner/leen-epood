<?php
// Set headers for JSON response
header('Content-Type: application/json');

// Load dependencies
require_once __DIR__ . '/../php/maksekeskus_integration/supabase_config.php';
require_once __DIR__ . '/../php/maksekeskus/lib/Maksekeskus.php';
require_once __DIR__ . '/../php/maksekeskus/vendor/autoload.php';

// Create log directory if it doesn't exist
$logDir = __DIR__ . '/../../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

try {
    // Get Maksekeskus configuration
    $config = getMaksekeskusConfig();
    
    $shopId = $config['shop_id'] ?? '';
    $publishableKey = $config['api_open_key'] ?? '';
    $secretKey = $config['api_secret_key'] ?? '';
    $testMode = $config['test_mode'] ?? false;
    
    if (!$shopId || !$secretKey) {
        throw new Exception('Maksekeskus configuration is incomplete');
    }
    
    // Initialize Maksekeskus client
    $client = new \Maksekeskus\Maksekeskus($shopId, $publishableKey, $secretKey, $testMode);
    
    // Get request data
    $requestData = $_REQUEST;
    
    // Verify the signature
    if (!$client->verifyMac($requestData)) {
        // Log the error but don't show it to the user
        file_put_contents($logDir . '/payment_errors.log', date('Y-m-d H:i:s') . ' - Invalid signature in success callback' . PHP_EOL, FILE_APPEND);
        
        // Redirect to success page anyway
        header('Location: /makse/korras');
        exit;
    }
    
    // Extract message data
    $messageData = $client->extractRequestData($requestData);
    
    // Log the success callback
    file_put_contents($logDir . '/payment_success.log', date('Y-m-d H:i:s') . ' - Success: ' . json_encode($messageData) . PHP_EOL, FILE_APPEND);
    
    // Redirect to success page
    header('Location: /makse/korras');
    exit;
    
} catch (Exception $e) {
    // Log the error
    file_put_contents($logDir . '/payment_errors.log', date('Y-m-d H:i:s') . ' - Success handler error: ' . $e->getMessage() . PHP_EOL, FILE_APPEND);
    
    // Redirect to success page anyway
    header('Location: /makse/korras');
    exit;
}