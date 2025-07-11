<?php
/**
 * Process payment
 * 
 * This endpoint creates a payment session with Maksekeskus and returns the payment URL.
 */

// Set headers
header('Content-Type: application/json');

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get request body
$requestBody = file_get_contents('php://input');
$data = json_decode($requestBody, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request body']);
    exit;
}

try {
    // Get Maksekeskus configuration from database
    $supabaseUrl = getenv('VITE_SUPABASE_URL');
    $supabaseKey = getenv('VITE_SUPABASE_SERVICE_ROLE_KEY');
    
    if (!$supabaseUrl || !$supabaseKey) {
        throw new Exception('Missing Supabase credentials. Please check your .env file.');
    }
    
    // Get active Maksekeskus configuration
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/maksekeskus_config?active=eq.true&limit=1');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey
    ]);
    
    $response = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($statusCode !== 200) {
        throw new Exception('Failed to get Maksekeskus configuration: ' . $response);
    }
    
    $configs = json_decode($response, true);
    
    if (empty($configs)) {
        throw new Exception('No active Maksekeskus configuration found');
    }
    
    $config = $configs[0];
    
    // Initialize Maksekeskus client
    $maksekeskus = new \Maksekeskus\Maksekeskus(
        $config['shop_id'],
        $config['api_open_key'],
        $config['api_secret_key'],
        $config['test_mode']
    );
    
    // Prepare transaction data
    $transactionData = [
        'amount' => $data['amount'],
        'currency' => 'EUR',
        'reference' => $data['reference'] ?? uniqid('order_'),
        'merchant_data' => json_encode([
            'customer_email' => $data['email'],
            'customer_name' => $data['firstName'] . ' ' . $data['lastName'],
            'customer_phone' => $data['phone'],
            'shipping_method' => $data['deliveryMethod'],
            'omniva_parcel_machine_id' => $data['omnivaParcelMachineId'] ?? null,
            'omniva_parcel_machine_name' => $data['omnivaParcelMachineName'] ?? null,
            'notes' => $data['notes'] ?? null
        ]),
        'return_url' => [
            'url' => $data['success_url'] ?? 'https://leen.ee/makse/korras'
        ],
        'cancel_url' => [
            'url' => $data['cancel_url'] ?? 'https://leen.ee/makse/katkestatud'
        ],
        'notification_url' => [
            'url' => 'https://leen.ee/php/teavitus'
        ]
    ];
    
    // Add items
    if (!empty($data['items'])) {
        $transactionData['transaction_items'] = [];
        
        foreach ($data['items'] as $item) {
            $transactionData['transaction_items'][] = [
                'name' => $item['title'],
                'price' => $item['price'],
                'quantity' => $item['quantity'] ?? 1,
                'product_id' => $item['id']
            ];
        }
    }
    
    // Create transaction
    $transaction = $maksekeskus->createTransaction($transactionData);
    
    // Create payment
    $paymentData = [
        'transaction' => $transaction->id,
        'method' => $data['paymentMethod'],
        'bank_country' => $data['bankCountry'] ?? 'ee'
    ];
    
    $payment = $maksekeskus->createPayment($transaction->id, $paymentData);
    
    // Return payment URL
    echo json_encode([
        'success' => true,
        'paymentUrl' => $payment->payment_link
    ]);
    
} catch (Exception $e) {
    // Log error
    error_log('Payment processing error: ' . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}