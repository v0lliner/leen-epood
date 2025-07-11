<?php
// public/php/maksekeskus_integration/process_payment.php

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

// Get request data
$requestData = json_decode(file_get_contents('php://input'), true);

// Validate request data
if (!$requestData) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request data']);
    exit;
}

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
    
    // Prepare transaction data
    $transaction = [
        'amount' => $requestData['amount'],
        'currency' => 'EUR',
        'reference' => $requestData['reference'] ?? 'leen-' . time(),
        'merchant_data' => [
            'customer_name' => $requestData['customerName'] ?? '',
            'customer_email' => $requestData['email'] ?? '',
            'customer_phone' => $requestData['phone'] ?? '',
            'delivery_method' => $requestData['deliveryMethod'] ?? '',
            'omniva_parcel_machine_id' => $requestData['omnivaParcelMachineId'] ?? '',
            'omniva_parcel_machine_name' => $requestData['omnivaParcelMachineName'] ?? '',
            'notes' => $requestData['notes'] ?? ''
        ],
        'return_url' => [
            'url' => 'https://leen.ee/makse/korras',
            'method' => 'GET'
        ],
        'cancel_url' => [
            'url' => 'https://leen.ee/makse/katkestatud',
            'method' => 'GET'
        ],
        'notification_url' => [
            'url' => 'https://leen.ee/makse/teavitus',
            'method' => 'POST'
        ],
        'customer' => [
            'email' => $requestData['email'] ?? '',
            'name' => $requestData['customerName'] ?? '',
            'phone' => $requestData['phone'] ?? '',
            'country' => $requestData['country'] ?? 'EE'
        ]
    ];
    
    // Add items to transaction
    if (isset($requestData['items']) && is_array($requestData['items'])) {
        $transaction['transaction_items'] = [];
        
        foreach ($requestData['items'] as $item) {
            $transaction['transaction_items'][] = [
                'name' => $item['title'] ?? 'Product',
                'price' => $item['price'] ?? 0,
                'quantity' => $item['quantity'] ?? 1,
                'product_id' => $item['id'] ?? ''
            ];
        }
    }
    
    // Create transaction
    $result = $client->createTransaction($transaction);
    
    // Prepare payment data
    $paymentData = [
        'transaction_id' => $result->id,
        'selected_bank' => $requestData['paymentMethod'] ?? ''
    ];
    
    // Create payment
    $payment = $client->createPayment($result->id, $paymentData);
    
    // Return payment URL
    echo json_encode([
        'success' => true,
        'paymentUrl' => $payment->payment_link
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Payment processing failed: ' . $e->getMessage()
    ]);
}