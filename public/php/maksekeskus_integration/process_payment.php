<?php
// public/php/maksekeskus_integration/process_payment.php
error_log("process_payment.php script started at " . date('Y-m-d H:i:s'));

// Ensure we can handle errors
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set headers for JSON response
header('Content-Type: application/json');

// Create logs directory if it doesn't exist
$logDir = __DIR__ . '/../../../logs/leen_payment_logs';
if (!file_exists($logDir)) {
    mkdir($logDir, 0775, true);
}

/**
 * Safe logging function that writes to a file and falls back to error_log if file writing fails
 */
function safeLog($filename, $message) {
    global $logDir;
    
    if (!file_exists($logDir)) {
        mkdir($logDir, 0775, true);
    }
    
    $logFile = $logDir . '/' . $filename;
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[{$timestamp}] {$message}" . PHP_EOL;
    
    // Try to write to file, fall back to error_log if it fails
    if (!file_put_contents($logFile, $logMessage, FILE_APPEND)) {
        error_log("Failed to write to log file {$logFile}. Message: {$message}");
    }
}

// Load Composer autoloader
require_once __DIR__ . '/../../vendor/autoload.php';

// Load Dotenv
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../../');
try {
    $dotenv->load();
    safeLog('env_loading.log', "Dotenv loaded successfully");
} catch (Exception $e) {
    safeLog('env_loading.log', "Failed to load Dotenv: " . $e->getMessage());
    error_log("Failed to load Dotenv: " . $e->getMessage());
}

// Load Supabase client
require_once __DIR__ . '/../supabase_client/SupabaseClient.php';

// Load Maksekeskus SDK
require_once __DIR__ . '/../maksekeskus/lib/Maksekeskus.php';

// Load configuration
require_once __DIR__ . '/supabase_config.php';

// Get raw input
$input = file_get_contents('php://input');
safeLog('payment_requests.log', "Received request: " . $input);

try {
    // Decode JSON input
    $data = json_decode($input);
    
    if (!$data) {
        throw new Exception("Invalid JSON input: " . json_last_error_msg());
    }
    
    // Validate required fields
    if (empty($data->email)) {
        throw new Exception("Email is required");
    }
    
    if (empty($data->items) || !is_array($data->items)) {
        throw new Exception("Items array is required");
    }
    
    // Create order data
    $orderData = [
        'customer_email' => $data->email,
        'customer_name' => $data->firstName . ' ' . $data->lastName,
        'customer_phone' => $data->phone ?? '',
        'shipping_address' => json_encode([
            'country' => $data->country ?? 'Estonia',
            'method' => $data->shippingMethod ?? 'pickup',
            'parcel_machine_id' => $data->omnivaParcelMachineId ?? null,
            'parcel_machine_name' => $data->omnivaParcelMachineName ?? null
        ]),
        'items' => json_encode($data->items),
        'subtotal' => floatval($data->amount) - floatval($data->shippingCost ?? 0),
        'shipping_cost' => floatval($data->shippingCost ?? 0),
        'total_amount' => floatval($data->amount),
        'status' => 'PENDING',
        'payment_status' => 'PENDING',
        'notes' => $data->notes ?? ''
    ];
    
    safeLog('order_data.log', "Order data prepared: " . json_encode($orderData));
    
    // Get Supabase configuration
    $supabaseUrl = $_ENV['SUPABASE_URL'] ?? null;
    $supabaseKey = $_ENV['SUPABASE_SERVICE_ROLE_KEY'] ?? null;
    
    if (!$supabaseUrl || !$supabaseKey) {
        safeLog('env_error.log', "Supabase configuration missing. ENV dump: " . json_encode($_ENV));
        safeLog('env_error.log', "SERVER dump: " . json_encode($_SERVER));
        throw new Exception("Supabase configuration missing");
    }
    
    // Validate that we're using a service_role key
    if (strpos($supabaseKey, 'eyJ') !== 0 || strpos($supabaseKey, 'service_role') === false) {
        safeLog('key_validation.log', "Key validation failed. Key starts with: " . substr($supabaseKey, 0, 10) . "..., length: " . strlen($supabaseKey) . ", md5: " . md5($supabaseKey));
        throw new Exception("Invalid Supabase key type. Must be a service_role key.");
    }
    
    // Initialize Supabase client
    safeLog('supabase_init.log', "Initializing Supabase client with URL: {$supabaseUrl}, Key length: " . strlen($supabaseKey) . ", Key hash: " . md5($supabaseKey));
    $supabase = new SupabaseClient($supabaseUrl, $supabaseKey);
    
    // Insert order into database
    safeLog('supabase_requests.log', "Inserting order into Supabase: " . json_encode($orderData));
    try {
        $order = $supabase->insert('orders', $orderData);
        
        if (!$order || !isset($order->id)) {
            safeLog('order_error.log', "Failed to create order record. Response: " . json_encode($order));
            throw new Exception("Failed to create order record");
        }
        
        safeLog('order_created.log', "Order created with ID: " . $order->id);
    } catch (Exception $e) {
        safeLog('supabase_error.log', "Supabase insert error: " . $e->getMessage());
        throw new Exception("Database error: " . $e->getMessage());
    }
    
    // Get Maksekeskus configuration
    $mkConfig = getMaksekeskusConfig();
    
    // Initialize Maksekeskus SDK
    $mk = new \Maksekeskus\Maksekeskus(
        $mkConfig['shop_id'],
        $mkConfig['api_open_key'],
        $mkConfig['api_secret_key'],
        $mkConfig['test_mode']
    );
    
    // Prepare transaction data
    $transactionData = [
        'amount' => $data->amount,
        'currency' => 'EUR',
        'reference' => $order->id,
        'merchant_data' => json_encode([
            'order_id' => $order->id
        ]),
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
        ],
        'customer' => [
            'email' => $data->email,
            'name' => $data->firstName . ' ' . $data->lastName,
            'phone' => $data->phone ?? '',
            'country' => substr($data->country ?? 'Estonia', 0, 2)
        ],
        'transaction_url' => [
            'return_url' => 'https://leen.ee/makse/korras',
            'cancel_url' => 'https://leen.ee/makse/katkestatud',
            'notification_url' => 'https://leen.ee/makse/teavitus'
        ]
    ];
    
    safeLog('transaction_data.log', "Transaction data prepared: " . json_encode($transactionData));
    
    // Create transaction
    try {
        $transaction = $mk->createTransaction($transactionData);
        
        if (!$transaction || !isset($transaction->payment_url)) {
            safeLog('transaction_error.log', "Failed to create payment transaction. Response: " . json_encode($transaction));
            throw new Exception("Failed to create payment transaction");
        }
        
        safeLog('transaction_created.log', "Transaction created with payment URL: " . $transaction->payment_url);
        
        // Update order with transaction ID
        $updateData = [
            'payment_reference' => $transaction->id
        ];
        
        $supabase->update('orders', $order->id, $updateData);
        
        // Return success response with payment URL
        echo json_encode([
            'success' => true,
            'paymentUrl' => $transaction->payment_url,
            'orderId' => $order->id
        ]);
    } catch (Exception $e) {
        safeLog('maksekeskus_error.log', "Maksekeskus error: " . $e->getMessage());
        throw new Exception("Payment gateway error: " . $e->getMessage());
    }
    
} catch (Exception $e) {
    // Log error
    safeLog('payment_errors.log', "Error: " . $e->getMessage() . "\nStack trace: " . $e->getTraceAsString());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}