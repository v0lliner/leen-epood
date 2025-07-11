<?php
// Set headers for JSON response
header('Content-Type: application/json');

// Load dependencies
require_once __DIR__ . '/supabase_config.php';
require_once __DIR__ . '/../maksekeskus/lib/Maksekeskus.php';
require_once __DIR__ . '/../maksekeskus/vendor/autoload.php';

// Create log directory if it doesn't exist
$logDir = __DIR__ . '/../../../../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

// Get request data
$requestData = json_decode(file_get_contents('php://input'), true);

// Validate request data
if (!$requestData) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request data']);
    exit;
}

// Log the request (with sensitive data masked)
$logData = $requestData;
if (isset($logData['email'])) {
    $email = $logData['email'];
    $atPos = strpos($email, '@');
    if ($atPos !== false) {
        $username = substr($email, 0, $atPos);
        $domain = substr($email, $atPos);
        $maskedUsername = substr($username, 0, 2) . str_repeat('*', strlen($username) - 2);
        $logData['email'] = $maskedUsername . $domain;
    }
}
if (isset($logData['phone'])) {
    $phone = $logData['phone'];
    $logData['phone'] = substr($phone, 0, 4) . str_repeat('*', strlen($phone) - 6) . substr($phone, -2);
}

file_put_contents($logDir . '/payment_requests.log', date('Y-m-d H:i:s') . ' - ' . json_encode($logData) . PHP_EOL, FILE_APPEND);

try {
    // Validate required fields
    $requiredFields = ['amount', 'email', 'firstName', 'lastName', 'phone', 'items'];
    foreach ($requiredFields as $field) {
        if (empty($requestData[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    // Validate email format
    if (!filter_var($requestData['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Validate amount (must be positive number)
    $amount = filter_var($requestData['amount'], FILTER_VALIDATE_FLOAT);
    if ($amount === false || $amount <= 0) {
        throw new Exception('Invalid amount');
    }
    
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
    
    // Create order in Supabase
    $supabase_url = $_ENV['VITE_SUPABASE_URL'] ?? getenv('VITE_SUPABASE_URL');
    $supabase_key = $_ENV['VITE_SUPABASE_SERVICE_ROLE_KEY'] ?? getenv('VITE_SUPABASE_SERVICE_ROLE_KEY');
    
    if (!$supabase_url || !$supabase_key) {
        throw new Exception('Supabase configuration is missing');
    }
    
    $supabaseService = new \PHPSupabase\Service($supabase_key, $supabase_url);
    $ordersDb = $supabaseService->initializeDatabase('orders', 'id');
    
    // Generate unique reference
    $reference = 'leen-' . time() . '-' . mt_rand(1000, 9999);
    
    // Sanitize input data
    $customerName = htmlspecialchars(trim($requestData['firstName'] . ' ' . $requestData['lastName']), ENT_QUOTES, 'UTF-8');
    $customerEmail = filter_var($requestData['email'], FILTER_SANITIZE_EMAIL);
    $customerPhone = htmlspecialchars(trim($requestData['phone']), ENT_QUOTES, 'UTF-8');
    $notes = isset($requestData['notes']) ? htmlspecialchars(trim($requestData['notes']), ENT_QUOTES, 'UTF-8') : '';
    
    // Prepare shipping address
    $shippingAddress = [
        'method' => $requestData['shippingMethod'] ?? 'pickup',
        'country' => $requestData['country'] ?? 'Estonia'
    ];
    
    if (isset($requestData['omnivaParcelMachineId']) && isset($requestData['omnivaParcelMachineName'])) {
        $shippingAddress['parcel_machine_id'] = htmlspecialchars($requestData['omnivaParcelMachineId'], ENT_QUOTES, 'UTF-8');
        $shippingAddress['parcel_machine_name'] = htmlspecialchars($requestData['omnivaParcelMachineName'], ENT_QUOTES, 'UTF-8');
    }
    
    // Prepare items
    $items = [];
    $subtotal = 0;
    
    if (isset($requestData['items']) && is_array($requestData['items'])) {
        foreach ($requestData['items'] as $item) {
            // Validate item data
            if (!isset($item['id'], $item['title'], $item['price'])) {
                continue;
            }
            
            // Convert price to float
            $price = filter_var(str_replace(['€', ','], ['', '.'], $item['price']), FILTER_VALIDATE_FLOAT);
            if ($price === false) {
                continue;
            }
            
            $items[] = [
                'id' => htmlspecialchars($item['id'], ENT_QUOTES, 'UTF-8'),
                'title' => htmlspecialchars($item['title'], ENT_QUOTES, 'UTF-8'),
                'price' => $price,
                'quantity' => 1
            ];
            
            $subtotal += $price;
        }
    }
    
    // Calculate shipping cost
    $shippingCost = 0;
    if (isset($requestData['shippingMethod']) && $requestData['shippingMethod'] === 'omniva') {
        $shippingCost = isset($requestData['shippingCost']) ? filter_var($requestData['shippingCost'], FILTER_VALIDATE_FLOAT) : 3.99;
    }
    
    // Insert order into database
    $orderData = [
        'customer_email' => $customerEmail,
        'customer_name' => $customerName,
        'customer_phone' => $customerPhone,
        'shipping_address' => json_encode($shippingAddress),
        'items' => json_encode($items),
        'subtotal' => $subtotal,
        'shipping_cost' => $shippingCost,
        'total_amount' => $amount,
        'status' => 'PENDING',
        'payment_status' => 'PENDING',
        'payment_method' => $requestData['paymentMethod'] ?? '',
        'payment_reference' => $reference,
        'notes' => $notes
    ];
    
    $newOrder = $ordersDb->insert($orderData);
    
    if ($ordersDb->getError()) {
        throw new Exception('Failed to create order: ' . $ordersDb->getError());
    }
    
    $orderId = $newOrder->id;
    
    // Prepare transaction for Maksekeskus
    $transaction = [
        'amount' => $amount,
        'currency' => 'EUR',
        'reference' => $reference,
        'merchant_data' => [
            'order_id' => $orderId,
            'customer_name' => $customerName,
            'customer_email' => $customerEmail
        ],
        'return_url' => [
            'url' => 'https://leen.ee/makse/korras.php',
            'method' => 'GET'
        ],
        'cancel_url' => [
            'url' => 'https://leen.ee/makse/katkestatud.php',
            'method' => 'GET'
        ],
        'notification_url' => [
            'url' => 'https://leen.ee/makse/teavitus.php',
            'method' => 'POST'
        ],
        'customer' => [
            'email' => $customerEmail,
            'name' => $customerName,
            'phone' => $customerPhone,
            'country' => $requestData['country'] ?? 'EE'
        ]
    ];
    
    // Add items to transaction
    if (!empty($items)) {
        $transaction['transaction_items'] = [];
        
        foreach ($items as $item) {
            $transaction['transaction_items'][] = [
                'name' => $item['title'],
                'price' => $item['price'],
                'quantity' => $item['quantity'],
                'product_id' => $item['id']
            ];
        }
    }
    
    // Create transaction in Maksekeskus
    $result = $client->createTransaction($transaction);
    
    // Create payment
    $paymentData = [
        'transaction_id' => $result->id,
        'selected_bank' => $requestData['paymentMethod'] ?? ''
    ];
    
    $payment = $client->createPayment($result->id, $paymentData);
    
    // Return payment URL
    echo json_encode([
        'success' => true,
        'paymentUrl' => $payment->payment_link,
        'orderId' => $orderId,
        'reference' => $reference
    ]);
    
} catch (Exception $e) {
    // Log the error
    file_put_contents($logDir . '/payment_errors.log', date('Y-m-d H:i:s') . ' - ' . $e->getMessage() . PHP_EOL, FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        'error' => 'Payment processing failed: ' . $e->getMessage()
    ]);
}