<?php
// public/php/maksekeskus_integration/process_payment.php

// Set headers for JSON response
// Set headers for JSON response
header('Content-Type: application/json');

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Capture all output for debugging
ob_start();

// Load Supabase configuration helper
require_once __DIR__ . '/supabase_config.php';

// Load Maksekeskus SDK
require_once __DIR__ . '/../maksekeskus/lib/Maksekeskus.php';
require_once __DIR__ . '/../maksekeskus/vendor/autoload.php';

// Get debug output so far
$debug_output = ob_get_clean();

// Get request data
$requestData = json_decode(file_get_contents('php://input'), true);

// Validate request data
if (!$requestData) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request data']);
    exit;
}

try {
    // Log the start of payment processing
    echo "Starting payment processing...\n";
    
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
    error_log('Maksekeskus config: ' . json_encode([
        'shopId' => $shopId,
        'testMode' => $testMode ? 'true' : 'false'
    ]));
    
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
    
    // For debugging, include the captured output
    if (!empty($debug_output)) {
        echo json_encode([
            'error' => 'Payment processing failed: ' . $e->getMessage(),
            'debug' => $debug_output
        ]);
    }
}