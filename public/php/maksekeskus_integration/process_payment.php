<?php
// Set headers for JSON response
header('Content-Type: application/json');

// Start output buffering to prevent any unwanted output
ob_start();

// Load dependencies
require_once __DIR__ . '/supabase_config.php';
require_once __DIR__ . '/../maksekeskus/lib/Maksekeskus.php';
require_once __DIR__ . '/../maksekeskus/vendor/autoload.php';

// Define log directory in /tmp which is writable in most hosting environments
$logDir = '/tmp/leen_payment_logs';

// Create log directory if it doesn't exist with proper permission checking
if (!is_dir($logDir)) {
    try {
        if (!mkdir($logDir, 0755, true) && !is_dir($logDir)) {
            // If directory creation fails, log to PHP error log instead
            error_log('Failed to create log directory: ' . $logDir);
        }
    } catch (Exception $e) {
        error_log('Exception creating log directory: ' . $e->getMessage());
    }
}

// Safe logging function that falls back to error_log if file writing fails
function safeLog($logFile, $message) {
    global $logDir;
    $logPath = $logDir . '/' . $logFile;
    
    try {
        if (is_writable($logDir) || is_writable($logPath)) {
            file_put_contents($logPath, date('Y-m-d H:i:s') . ' - ' . $message . PHP_EOL, FILE_APPEND);
        } else {
            // Fallback to PHP's error_log
            error_log('Payment log: ' . $message);
        }
    } catch (Exception $e) {
        error_log('Exception in safeLog: ' . $e->getMessage() . ' - Original message: ' . $message);
    }
}

// Function to return JSON response and end script execution
function returnJsonResponse($data, $statusCode = 200) {
    // Clean any output that might have been generated
    if (ob_get_length()) ob_clean();
    
    // Set status code
    http_response_code($statusCode);
    
    // Return JSON response
    echo json_encode($data);
    exit;
}

try {
    // Get request data
    $requestBody = file_get_contents('php://input');
    $requestData = json_decode($requestBody, true);

    // Validate request data
    if (!$requestData) {
        returnJsonResponse(['error' => 'Invalid request data'], 400);
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

    safeLog('payment_requests.log', json_encode($logData));

    // Validate required fields
    $requiredFields = ['amount', 'email', 'firstName', 'lastName', 'phone', 'items'];
    $missingFields = [];
    
    foreach ($requiredFields as $field) {
        if (empty($requestData[$field])) {
            $missingFields[] = $field;
        }
    }
    
    if (!empty($missingFields)) {
        returnJsonResponse([
            'error' => 'Missing required fields: ' . implode(', ', $missingFields)
        ], 400);
    }
    
    // Validate email format
    if (!filter_var($requestData['email'], FILTER_VALIDATE_EMAIL)) {
        returnJsonResponse(['error' => 'Invalid email format'], 400);
    }
    
    // Validate amount (must be positive number)
    $amount = filter_var($requestData['amount'], FILTER_VALIDATE_FLOAT);
    if ($amount === false || $amount <= 0) {
        returnJsonResponse(['error' => 'Invalid amount'], 400);
    }
    
    // Get Maksekeskus configuration
    $config = getMaksekeskusConfig();
    
    $shopId = $config['shop_id'] ?? '';
    $publishableKey = $config['api_open_key'] ?? '';
    $secretKey = $config['api_secret_key'] ?? '';
    $testMode = $config['test_mode'] ?? false;
    
    if (!$shopId || !$secretKey) {
        returnJsonResponse(['error' => 'Maksekeskus configuration is incomplete'], 500);
    }
    
    // Initialize Maksekeskus client
    $client = new \Maksekeskus\Maksekeskus($shopId, $publishableKey, $secretKey, $testMode);
    
    // Create order in Supabase
    $supabase_url = $_ENV['VITE_SUPABASE_URL'] ?? getenv('VITE_SUPABASE_URL');
    $supabase_key = $_ENV['VITE_SUPABASE_SERVICE_ROLE_KEY'] ?? getenv('VITE_SUPABASE_SERVICE_ROLE_KEY');
    
    if (!$supabase_url || !$supabase_key) {
        returnJsonResponse(['error' => 'Supabase configuration is missing'], 500);
    }
    
    try {
        $supabaseService = new \PHPSupabase\Service($supabase_key, $supabase_url);
        $ordersDb = $supabaseService->initializeDatabase('orders', 'id');
    } catch (Exception $e) {
        safeLog('payment_errors.log', 'Supabase initialization error: ' . $e->getMessage());
        returnJsonResponse(['error' => 'Database connection error'], 500);
    }
    
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
    
    try {
        $newOrder = $ordersDb->insert($orderData);
        
        if ($ordersDb->getError()) {
            throw new Exception('Failed to create order: ' . $ordersDb->getError());
        }
        
        $orderId = $newOrder->id;
    } catch (Exception $e) {
        safeLog('payment_errors.log', 'Order creation error: ' . $e->getMessage());
        returnJsonResponse(['error' => 'Failed to create order'], 500);
    }
    
    // Prepare transaction for Maksekeskus
    try {
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
        returnJsonResponse([
            'success' => true,
            'paymentUrl' => $payment->payment_link,
            'orderId' => $orderId,
            'reference' => $reference
        ]);
    } catch (Exception $e) {
        // Update order status to FAILED
        try {
            $ordersDb->update($orderId, [
                'status' => 'CANCELLED',
                'payment_status' => 'FAILED',
                'updated_at' => date('c')
            ]);
        } catch (Exception $updateEx) {
            safeLog('payment_errors.log', 'Failed to update order status: ' . $updateEx->getMessage());
        }
        
        // Log the error
        safeLog('payment_errors.log', 'Payment processing error: ' . $e->getMessage());
        
        // Return error response
        returnJsonResponse([
            'error' => 'Payment processing failed: ' . $e->getMessage()
        ], 500);
    }
    
} catch (Exception $e) {
    // Log the error
    error_log('Critical payment error: ' . $e->getMessage());
    
    // Return error response
    returnJsonResponse([
        'error' => 'An unexpected error occurred'
    ], 500);
}

// Clean output buffer before exiting
if (ob_get_length()) ob_end_clean();