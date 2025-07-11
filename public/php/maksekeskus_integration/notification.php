<?php
// public/php/maksekeskus_integration/notification.php

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
    error_log('Maksekeskus notification config: ' . json_encode([
        'shopId' => $shopId,
        'testMode' => $testMode ? 'true' : 'false'
    ]));
    
    $client = new \Maksekeskus\Maksekeskus($shopId, $publishableKey, $secretKey, $testMode);
    
    // Get request data
    $requestData = $_REQUEST;
    
    // Verify the notification
    if (!$client->verifyMac($requestData)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid signature']);
        exit;
    }
    
    // Extract message data
    $messageData = $client->extractRequestData($requestData);
    
    // Process the notification
    if ($messageData['status'] === 'COMPLETED') {
        // Payment was successful
        // Here you would typically:
        // 1. Update order status in your database
        // 2. Send confirmation email to customer
        // 3. Send notification to admin
        
        // For now, just log the transaction
        $logFile = __DIR__ . '/../../logs/payments.log';
        $logDir = dirname($logFile);
        
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $logData = date('Y-m-d H:i:s') . ' - Payment completed: ' . json_encode($messageData) . PHP_EOL;
        file_put_contents($logFile, $logData, FILE_APPEND);
        
        // Send email notification
        $to = 'leen@leen.ee';
        $subject = 'New payment received';
        $message = "A new payment has been received.\n\n";
        $message .= "Transaction ID: " . ($messageData['transaction'] ?? 'N/A') . "\n";
        $message .= "Amount: " . ($messageData['amount'] ?? 'N/A') . " EUR\n";
        $message .= "Status: " . ($messageData['status'] ?? 'N/A') . "\n";
        $message .= "Reference: " . ($messageData['reference'] ?? 'N/A') . "\n";
        
        $headers = 'From: noreply@leen.ee' . "\r\n" .
                   'Reply-To: noreply@leen.ee' . "\r\n" .
                   'X-Mailer: PHP/' . phpversion();
        
        mail($to, $subject, $message, $headers);
    }
    
    // Return success response
    echo json_encode(['success' => true]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Notification processing failed: ' . $e->getMessage()
    ]);
}