<?php
/**
 * Maksekeskus Payment Processing
 * Direct API integration without SDK
 */

// Set error reporting for development
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Create logs directory if it doesn't exist
$logDir = __DIR__ . '/logs';
if (!file_exists($logDir)) {
    mkdir($logDir, 0775, true);
}

// Load Composer autoloader if it exists
$autoloadPath = __DIR__ . '/../../../vendor/autoload.php';
if (file_exists($autoloadPath)) {
    require_once $autoloadPath;
    
    // Load environment variables using Dotenv
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../../');
    try {
        $dotenv->load();
        safeLog('env_loading.log', "Dotenv loaded successfully");
    } catch (Exception $e) {
        safeLog('env_loading.log', "Failed to load Dotenv: " . $e->getMessage());
    }
}

// Headers for JSON response
header('Content-Type: application/json');

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

/**
 * Log environment variables (excluding sensitive data)
 */
function logEnvironmentVariables() {
    $env = $_ENV;
    
    // Mask sensitive values
    foreach ($env as $key => $value) {
        if (stripos($key, 'key') !== false || stripos($key, 'secret') !== false || stripos($key, 'password') !== false) {
            $env[$key] = 'MASKED (length: ' . strlen($value) . ')';
        }
    }
    
    safeLog('environment.log', "Environment variables: " . json_encode($env, JSON_PRETTY_PRINT));
}

/**
 * Get Supabase configuration from environment variables
 */
function getSupabaseConfig() {
    $supabaseUrl = $_ENV['SUPABASE_URL'] ?? null;
    $supabaseKey = $_ENV['SUPABASE_SERVICE_ROLE_KEY'] ?? null;
    
    if (!$supabaseUrl || !$supabaseKey) {
        safeLog('error.log', "Missing Supabase configuration. SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.");
        throw new Exception("Supabase configuration missing");
    }
    
    // Validate that we're using the service_role key (it should contain the text "service_role")
    if (strpos($supabaseKey, 'service_role') === false) {
        safeLog('error.log', "Invalid Supabase key type. Must use service_role key for database operations.");
        throw new Exception("Invalid Supabase key type");
    }
    
    safeLog('supabase.log', "Supabase URL: {$supabaseUrl}, Key type: service_role, Key length: " . strlen($supabaseKey));
    
    return [
        'url' => $supabaseUrl,
        'key' => $supabaseKey
    ];
}

/**
 * Get Maksekeskus configuration based on test mode setting
 */
function getMaksekeskusConfig() {
    try {
        // Get test mode setting from Supabase
        $testMode = getMaksekeskusTestMode();
        
        // Test credentials
        $testConfig = [
            'shop_id' => 'f7741ab2-7445-45f9-9af4-0d0408ef1e4c',
            'publishable_key' => 'zPA6jCTIvGKYqrXxlgkXLzv3F82Mjv2E',
            'secret_key' => 'pfOsGD9oPaFEILwqFLHEHkPf7vZz4j3t36nAcufP1abqT9l99koyuC1IWAOcBeqt',
            'api_url' => 'https://api-sandbox.maksekeskus.ee/v1/transactions'
        ];
        
        // Live credentials
        $liveConfig = [
            'shop_id' => '4e2bed9a-aa24-4b87-801b-56c31c535d36',
            'publishable_key' => 'wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM',
            'secret_key' => 'WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ',
            'api_url' => 'https://api.maksekeskus.ee/v1/transactions'
        ];
        
        $config = $testMode ? $testConfig : $liveConfig;
        
        safeLog('maksekeskus.log', "Using Maksekeskus " . ($testMode ? "TEST" : "LIVE") . " mode with shop ID: {$config['shop_id']}");
        
        return $config;
    } catch (Exception $e) {
        // If we can't determine test mode, default to test mode for safety
        safeLog('error.log', "Error determining test mode: " . $e->getMessage() . ". Defaulting to TEST mode.");
        
        return [
            'shop_id' => 'f7741ab2-7445-45f9-9af4-0d0408ef1e4c',
            'publishable_key' => 'zPA6jCTIvGKYqrXxlgkXLzv3F82Mjv2E',
            'secret_key' => 'pfOsGD9oPaFEILwqFLHEHkPf7vZz4j3t36nAcufP1abqT9l99koyuC1IWAOcBeqt',
            'api_url' => 'https://api-sandbox.maksekeskus.ee/v1/transactions'
        ];
    }
}

/**
 * Get Maksekeskus test mode setting from Supabase
 */
function getMaksekeskusTestMode() {
    static $testMode = null;
    
    // Return cached value if available
    if ($testMode !== null) {
        return $testMode;
    }
    
    try {
        $supabaseConfig = getSupabaseConfig();
        
        // Query Supabase for test mode setting
        $ch = curl_init($supabaseConfig['url'] . '/rest/v1/maksekeskus_config?select=test_mode&active=eq.true&limit=1');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $supabaseConfig['key'],
            'Authorization: Bearer ' . $supabaseConfig['key'],
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            safeLog('error.log', "Failed to get test mode setting. HTTP code: {$httpCode}, Response: {$response}");
            throw new Exception("Failed to get test mode setting");
        }
        
        $data = json_decode($response, true);
        
        if (empty($data)) {
            safeLog('maksekeskus.log', "No Maksekeskus config found in database. Defaulting to TEST mode.");
            $testMode = true;
            return $testMode;
        }
        
        $testMode = $data[0]['test_mode'] ?? true;
        safeLog('maksekeskus.log', "Retrieved test_mode from database: " . ($testMode ? "true" : "false"));
        
        return $testMode;
    } catch (Exception $e) {
        safeLog('error.log', "Error getting test mode: " . $e->getMessage() . ". Defaulting to TEST mode.");
        $testMode = true;
        return $testMode;
    }
}

/**
 * Create a new order in Supabase
 */
function createOrder($orderData) {
    try {
        $supabaseConfig = getSupabaseConfig();
        
        // Prepare order data for insertion
        $orderInsertData = [
            'customer_email' => $orderData['email'],
            'customer_name' => $orderData['firstName'] . ' ' . $orderData['lastName'],
            'customer_phone' => $orderData['phone'] ?? null,
            'shipping_address' => json_encode([
                'country' => $orderData['country'] ?? 'Estonia',
                'parcel_machine_id' => $orderData['omnivaParcelMachineId'] ?? null,
                'parcel_machine_name' => $orderData['omnivaParcelMachineName'] ?? null
            ]),
            'items' => json_encode($orderData['items'] ?? []),
            'subtotal' => $orderData['subtotal'] ?? 0,
            'shipping_cost' => $orderData['shipping_cost'] ?? 0,
            'total_amount' => $orderData['total_amount'] ?? 0,
            'status' => 'PENDING',
            'payment_status' => 'PENDING',
            'payment_method' => $orderData['paymentMethod'] ?? null,
            'notes' => $orderData['notes'] ?? null
        ];
        
        // Log the order data (excluding sensitive information)
        $logOrderData = $orderInsertData;
        $logOrderData['customer_email'] = substr($logOrderData['customer_email'], 0, 3) . '***@***' . substr(strrchr($logOrderData['customer_email'], '.'), 0);
        $logOrderData['customer_phone'] = $logOrderData['customer_phone'] ? '***' . substr($logOrderData['customer_phone'], -4) : null;
        safeLog('orders.log', "Creating new order: " . json_encode($logOrderData));
        
        // Insert order into Supabase
        $ch = curl_init($supabaseConfig['url'] . '/rest/v1/orders');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderInsertData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $supabaseConfig['key'],
            'Authorization: Bearer ' . $supabaseConfig['key'],
            'Content-Type: application/json',
            'Prefer: return=representation'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 201) {
            safeLog('error.log', "Failed to create order. HTTP code: {$httpCode}, Response: {$response}");
            throw new Exception("Failed to create order");
        }
        
        $data = json_decode($response, true);
        
        if (empty($data) || !isset($data[0]['id'])) {
            safeLog('error.log', "Invalid order creation response: " . json_encode($data));
            throw new Exception("Invalid order creation response");
        }
        
        safeLog('orders.log', "Order created successfully with ID: " . $data[0]['id']);
        
        return $data[0];
    } catch (Exception $e) {
        safeLog('error.log', "Error creating order: " . $e->getMessage());
        throw $e;
    }
}

/**
 * Create a Maksekeskus transaction
 */
function createMaksekeskusTransaction($order, $orderData) {
    try {
        $maksekeskusConfig = getMaksekeskusConfig();
        
        // Prepare transaction data
        $transactionData = [
            'transaction' => [
                'amount' => $order['total_amount'],
                'currency' => 'EUR',
                'reference' => $order['id'],
                'merchant_data' => json_encode(['order_id' => $order['id']]),
                'return_url' => 'https://leen.ee/makse/korras.php',
                'cancel_url' => 'https://leen.ee/makse/katkestatud.php',
                'notification_url' => 'https://leen.ee/makse/teavitus.php'
            ],
            'customer' => [
                'email' => $order['customer_email'],
                'name' => $order['customer_name'],
                'phone' => $order['customer_phone'],
                'country' => json_decode($order['shipping_address'], true)['country'] ?? 'Estonia'
            ]
        ];
        
        // Log the transaction data (excluding sensitive information)
        $logTransactionData = $transactionData;
        $logTransactionData['customer']['email'] = substr($logTransactionData['customer']['email'], 0, 3) . '***@***' . substr(strrchr($logTransactionData['customer']['email'], '.'), 0);
        $logTransactionData['customer']['phone'] = $logTransactionData['customer']['phone'] ? '***' . substr($logTransactionData['customer']['phone'], -4) : null;
        safeLog('maksekeskus.log', "Creating transaction: " . json_encode($logTransactionData));
        
        // Create transaction in Maksekeskus
        $ch = curl_init($maksekeskusConfig['api_url']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($transactionData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Basic ' . base64_encode($maksekeskusConfig['shop_id'] . ':' . $maksekeskusConfig['publishable_key'])
        ]);
        curl_setopt($ch, CURLOPT_VERBOSE, true);
        
        // Capture curl verbose output
        $verbose = fopen('php://temp', 'w+');
        curl_setopt($ch, CURLOPT_STDERR, $verbose);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        // Log verbose output
        rewind($verbose);
        $verboseLog = stream_get_contents($verbose);
        fclose($verbose);
        safeLog('curl_verbose.log', "CURL verbose output for transaction creation: " . $verboseLog);
        
        curl_close($ch);
        
        if ($httpCode !== 200) {
            safeLog('error.log', "Failed to create transaction. HTTP code: {$httpCode}, Response: {$response}");
            throw new Exception("Failed to create transaction");
        }
        
        $data = json_decode($response, true);
        
        if (empty($data) || !isset($data['payment_url'])) {
            safeLog('error.log', "Invalid transaction creation response: " . json_encode($data));
            throw new Exception("Invalid transaction creation response");
        }
        
        safeLog('maksekeskus.log', "Transaction created successfully with payment URL: " . $data['payment_url']);
        
        return $data;
    } catch (Exception $e) {
        safeLog('error.log', "Error creating transaction: " . $e->getMessage());
        throw $e;
    }
}

/**
 * Update order with transaction data
 */
function updateOrderWithTransaction($orderId, $transactionData) {
    try {
        $supabaseConfig = getSupabaseConfig();
        
        // Prepare order update data
        $orderUpdateData = [
            'payment_reference' => $transactionData['id'] ?? null
        ];
        
        // Update order in Supabase
        $ch = curl_init($supabaseConfig['url'] . '/rest/v1/orders?id=eq.' . $orderId);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderUpdateData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $supabaseConfig['key'],
            'Authorization: Bearer ' . $supabaseConfig['key'],
            'Content-Type: application/json',
            'Prefer: return=representation'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            safeLog('error.log', "Failed to update order with transaction data. HTTP code: {$httpCode}, Response: {$response}");
            throw new Exception("Failed to update order with transaction data");
        }
        
        safeLog('orders.log', "Order {$orderId} updated with transaction data");
        
        return true;
    } catch (Exception $e) {
        safeLog('error.log', "Error updating order with transaction data: " . $e->getMessage());
        throw $e;
    }
}

/**
 * Validate required fields in the request
 */
function validateRequest($data) {
    $requiredFields = ['email', 'firstName', 'lastName', 'items', 'total_amount'];
    $missingFields = [];
    
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            $missingFields[] = $field;
        }
    }
    
    if (!empty($missingFields)) {
        throw new Exception("Missing required fields: " . implode(', ', $missingFields));
    }
    
    // Validate email format
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email format");
    }
    
    // Validate items array
    if (!is_array($data['items']) || empty($data['items'])) {
        throw new Exception("Items must be a non-empty array");
    }
    
    // Validate amount
    if (!is_numeric($data['total_amount']) || $data['total_amount'] <= 0) {
        throw new Exception("Total amount must be a positive number");
    }
    
    return true;
}

// Main execution
try {
    // Log environment variables
    logEnvironmentVariables();
    
    // Check if this is a POST request
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit;
    }
    
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception("Invalid JSON input");
    }
    
    // Log the request (excluding sensitive data)
    $logData = $data;
    if (isset($logData['email'])) {
        $logData['email'] = substr($logData['email'], 0, 3) . '***@***' . substr(strrchr($logData['email'], '.'), 0);
    }
    if (isset($logData['phone'])) {
        $logData['phone'] = $logData['phone'] ? '***' . substr($logData['phone'], -4) : null;
    }
    safeLog('requests.log', "Received payment request: " . json_encode($logData));
    
    // Validate request data
    validateRequest($data);
    
    // Create order in Supabase
    $order = createOrder($data);
    
    // Create transaction in Maksekeskus
    $transaction = createMaksekeskusTransaction($order, $data);
    
    // Update order with transaction data
    updateOrderWithTransaction($order['id'], $transaction);
    
    // Return success response with payment URL
    echo json_encode([
        'success' => true,
        'paymentUrl' => $transaction['payment_url'],
        'orderId' => $order['id']
    ]);
    
} catch (Exception $e) {
    safeLog('error.log', "Payment processing error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}