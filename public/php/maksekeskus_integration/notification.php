<?php
// public/php/maksekeskus_integration/notification.php

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