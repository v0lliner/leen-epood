<?php
// public/makse/teavitus.php
error_log("teavitus.php script started at " . date('Y-m-d H:i:s'));

// Ensure we can handle errors
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Create logs directory if it doesn't exist
$logDir = __DIR__ . '/../../logs/leen_payment_logs';
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
require_once __DIR__ . '/../php/vendor/autoload.php';

// Load Dotenv
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
try {
    $dotenv->load();
    safeLog('env_loading.log', "Dotenv loaded successfully");
} catch (Exception $e) {
    safeLog('env_loading.log', "Failed to load Dotenv: " . $e->getMessage());
    error_log("Failed to load Dotenv: " . $e->getMessage());
}

// Load Supabase client
require_once __DIR__ . '/../php/supabase_client/SupabaseClient.php';

// Get raw input
$input = file_get_contents('php://input');
safeLog('payment_notifications.log', "Received notification: " . $input);

try {
    // Decode JSON input
    $data = json_decode($input);
    
    if (!$data) {
        throw new Exception("Invalid JSON input: " . json_last_error_msg());
    }
    
    // Extract order ID from merchant_data
    $merchantData = json_decode($data->merchant_data ?? '{}');
    $orderId = $merchantData->order_id ?? null;
    
    if (!$orderId) {
        throw new Exception("Order ID not found in merchant data");
    }
    
    // Get Supabase configuration
    $supabaseUrl = $_ENV['SUPABASE_URL'] ?? null;
    $supabaseKey = $_ENV['SUPABASE_SERVICE_ROLE_KEY'] ?? null;
    
    if (!$supabaseUrl || !$supabaseKey) {
        safeLog('env_error.log', "Supabase configuration missing. ENV dump: " . json_encode($_ENV));
        safeLog('env_error.log', "SERVER dump: " . json_encode($_SERVER));
        throw new Exception("Supabase configuration missing");
    }
    
    // Initialize Supabase client
    $supabase = new SupabaseClient($supabaseUrl, $supabaseKey);
    
    // Update order status
    $updateData = [
        'payment_status' => $data->status ?? 'PENDING',
        'status' => ($data->status === 'COMPLETED') ? 'PAID' : 'PENDING'
    ];
    
    $supabase->update('orders', $orderId, $updateData);
    
    safeLog('payment_notifications.log', "Order {$orderId} updated with status: {$data->status}");
    
    // Return success response
    echo json_encode(['success' => true]);
    
} catch (Exception $e) {
    // Log error
    safeLog('payment_errors.log', "Notification error: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}