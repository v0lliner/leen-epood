<?php
// Start output buffering to prevent any unwanted output
ob_start();

// Set headers for JSON response
header('Content-Type: application/json');

// Define log directory in /tmp which is writable in most hosting environments
$logDir = '/tmp/leen_payment_logs';

// Create log directory if it doesn't exist
if (!is_dir($logDir)) {
    // Try to create the directory with proper permissions
    try {
        mkdir($logDir, 0755, true);
    } catch (Exception $e) {
        // Silently continue - we'll handle logging failures later
    }
}

// Safe logging function that falls back to error_log if file writing fails
function safeLog($logFile, $message) {
    global $logDir;
    $logPath = $logDir . '/' . $logFile;
    
    try {
        if (is_dir($logDir) && (is_writable($logDir) || is_writable($logPath))) {
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
    // Load Supabase configuration
    require_once __DIR__ . '/supabase_config.php';

    // Load Maksekeskus SDK
    require_once __DIR__ . '/../maksekeskus/lib/Maksekeskus.php';
    
    // Load SupabaseClient
    require_once __DIR__ . '/../supabase_client/SupabaseClient.php';

    // Get request body
    $requestBody = file_get_contents('php://input');
    $requestData = json_decode($requestBody, true);
    
    // Log the request (with sensitive data masked)
    $safeData = $requestData;
    if (isset($safeData['email'])) {
        $email = $safeData['email'];
        $atPos = strpos($email, '@');
        if ($atPos !== false) {
            $username = substr($email, 0, $atPos);
            $domain = substr($email, $atPos);
            $maskedUsername = substr($username, 0, 2) . str_repeat('*', strlen($username) - 2);
            $safeData['email'] = $maskedUsername . $domain;
        }
    }
    if (isset($safeData['phone'])) {
        $phone = $safeData['phone'];
        $safeData['phone'] = substr($phone, 0, 4) . str_repeat('*', strlen($phone) - 6) . substr($phone, -2);
    }
    
    safeLog('payment_requests.log', json_encode($safeData));
    
    // Validate request data
    if (!isset($requestData['amount']) || !is_numeric($requestData['amount'])) {
        returnJsonResponse(['success' => false, 'error' => 'Invalid amount'], 400);
    }
    
    if (!isset($requestData['email']) || !filter_var($requestData['email'], FILTER_VALIDATE_EMAIL)) {
        returnJsonResponse(['success' => false, 'error' => 'Invalid email'], 400);
    }
    
    if (!isset($requestData['items']) || !is_array($requestData['items']) || empty($requestData['items'])) {
        returnJsonResponse(['success' => false, 'error' => 'No items in cart'], 400);
    }
    
    // Get Maksekeskus configuration
    $config = getMaksekeskusConfig();
    
    $shopId = $config['shop_id'] ?? '';
    $publishableKey = $config['api_open_key'] ?? '';
    $secretKey = $config['api_secret_key'] ?? '';
    $testMode = $config['test_mode'] ?? false;
    
    if (!$shopId || !$secretKey) {
        returnJsonResponse(['success' => false, 'error' => 'Payment gateway configuration is incomplete'], 500);
    }
    
    // Initialize Maksekeskus client
    $client = new \Maksekeskus\Maksekeskus($shopId, $publishableKey, $secretKey, $testMode);
    
    // Create a new order in Supabase
    $orderId = null;
    try {
        // Connect to Supabase
        $supabase_url = $_ENV['VITE_SUPABASE_URL'] ?? getenv('VITE_SUPABASE_URL');
        $supabase_key = $_ENV['VITE_SUPABASE_SERVICE_ROLE_KEY'] ?? getenv('VITE_SUPABASE_SERVICE_ROLE_KEY');
        
        if (!$supabase_url || !$supabase_key) {
            throw new Exception('Supabase configuration is missing');
        }
        
        // Initialize SupabaseClient
        $supabase = new SupabaseClient($supabase_url, $supabase_key);
        
        // Prepare order data
        $orderData = [
            'customer_email' => $requestData['email'],
            'customer_name' => $requestData['firstName'] . ' ' . $requestData['lastName'],
            'customer_phone' => $requestData['phone'] ?? null,
            'shipping_address' => json_encode([
                'country' => $requestData['country'] ?? 'Estonia',
                'method' => $requestData['shippingMethod'] ?? 'pickup',
                'parcel_machine_id' => $requestData['omnivaParcelMachineId'] ?? null,
                'parcel_machine_name' => $requestData['omnivaParcelMachineName'] ?? null
            ]),
            'items' => json_encode($requestData['items']),
            'subtotal' => floatval($requestData['amount']) - floatval($requestData['shippingCost'] ?? 0),
            'shipping_cost' => floatval($requestData['shippingCost'] ?? 0),
            'total_amount' => floatval($requestData['amount']),
            'status' => 'PENDING',
            'payment_status' => 'PENDING',
            'payment_method' => $requestData['paymentMethod'] ?? null,
            'notes' => $requestData['notes'] ?? null,
            'created_at' => date('c')
        ];
        
        // Insert order into database
        $result = $supabase->insert('orders', $orderData);
        
        if (!$result || !isset($result[0]->id)) {
            throw new Exception('Failed to create order in Supabase');
        }
        
        $orderId = $result[0]->id;
        safeLog('payment_orders.log', 'Created order: ' . $orderId);
        
    } catch (Exception $e) {
        safeLog('payment_errors.log', 'Database error: ' . $e->getMessage());
        returnJsonResponse(['success' => false, 'error' => 'Failed to create order record'], 500);
    }
    
    // Prepare transaction data for Maksekeskus
    $transactionData = [
        'amount' => $requestData['amount'],
        'currency' => 'EUR',
        'reference' => $orderId,
        'merchant_data' => [
            'order_id' => $orderId
        ],
        'customer' => [
            'email' => $requestData['email'],
            'name' => $requestData['firstName'] . ' ' . $requestData['lastName'],
            'phone' => $requestData['phone'] ?? null,
            'country' => substr($requestData['country'] ?? 'Estonia', 0, 2)
        ],
        'return_url' => [
            'url' => 'https://leen.ee/makse/korras.php',
            'method' => 'POST'
        ],
        'cancel_url' => [
            'url' => 'https://leen.ee/makse/katkestatud.php',
            'method' => 'POST'
        ],
        'notification_url' => [
            'url' => 'https://leen.ee/makse/teavitus.php',
            'method' => 'POST'
        ]
    ];
    
    // Add transaction items
    $transactionData['transaction_items'] = [];
    foreach ($requestData['items'] as $item) {
        $transactionData['transaction_items'][] = [
            'name' => $item['title'] ?? 'Product',
            'price' => floatval($item['price'] ?? 0),
            'quantity' => 1,
            'product_id' => $item['id'] ?? null
        ];
    }
    
    // Add shipping as a transaction item if applicable
    if (isset($requestData['shippingCost']) && floatval($requestData['shippingCost']) > 0) {
        $transactionData['transaction_items'][] = [
            'name' => 'Shipping',
            'price' => floatval($requestData['shippingCost']),
            'quantity' => 1,
            'product_id' => 'shipping'
        ];
    }
    
    try {
        // Create transaction in Maksekeskus
        $transaction = $client->createTransaction($transactionData);
        
        // Log the transaction ID
        safeLog('payment_transactions.log', 'Created transaction: ' . $transaction->id . ' for order: ' . $orderId);
        
        // Return payment URL to frontend
        returnJsonResponse([
            'success' => true,
            'paymentUrl' => $transaction->payment_url,
            'transactionId' => $transaction->id,
            'orderId' => $orderId
        ]);
        
    } catch (\Maksekeskus\MKException $e) {
        // Log the error
        safeLog('payment_errors.log', 'Maksekeskus error: ' . $e->getMessage() . ' - Raw: ' . $e->getRawContent());
        
        // Update order status to FAILED
        if ($orderId) {
            try {
                $supabase->update('orders', $orderId, [
                    'status' => 'CANCELLED',
                    'payment_status' => 'FAILED',
                    'updated_at' => date('c')
                ]);
            } catch (Exception $updateEx) {
                safeLog('payment_errors.log', 'Failed to update order status: ' . $updateEx->getMessage());
            }
        }
        
        returnJsonResponse(['success' => false, 'error' => 'Payment gateway error: ' . $e->getMessage()], 500);
    } catch (Exception $e) {
        // Log the error
        safeLog('payment_errors.log', 'General error: ' . $e->getMessage());
        
        // Update order status to FAILED
        if ($orderId) {
            try {
                $supabase->update('orders', $orderId, [
                    'status' => 'CANCELLED',
                    'payment_status' => 'FAILED',
                    'updated_at' => date('c')
                ]);
            } catch (Exception $updateEx) {
                safeLog('payment_errors.log', 'Failed to update order status: ' . $updateEx->getMessage());
            }
        }
        
        returnJsonResponse(['success' => false, 'error' => 'An unexpected error occurred'], 500);
    }
    
} catch (Exception $e) {
    // Log the error
    safeLog('payment_errors.log', 'Critical error: ' . $e->getMessage());
    
    // Return error response
    returnJsonResponse(['success' => false, 'error' => 'Server error occurred'], 500);
}