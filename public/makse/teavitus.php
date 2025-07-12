<?php
// public/makse/teavitus.php
error_log("teavitus.php script started at " . date('Y-m-d H:i:s'));

// Ensure we can handle errors
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Create logs directory if it doesn't exist
$logDir = __DIR__ . '/../php/payment/logs';
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

// Get raw input
$input = file_get_contents('php://input');
safeLog('payment_notifications.log', "Received notification: " . $input);

// Load Composer autoloader if it exists
$autoloadPath = __DIR__ . '/../../vendor/autoload.php';
if (file_exists($autoloadPath)) {
    require_once $autoloadPath;
    
    // Load environment variables using Dotenv
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
    try {
        $dotenv->load();
        safeLog('env_loading.log', "Dotenv loaded successfully");
    } catch (Exception $e) {
        safeLog('env_loading.log', "Failed to load Dotenv: " . $e->getMessage());
    }
}

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
        throw new Exception("Supabase configuration missing");
    }
    
    // Update order status
    $updateData = [
        'payment_status' => $data->status ?? 'PENDING',
        'status' => ($data->status === 'COMPLETED') ? 'PAID' : 'PENDING'
    ];
    
    $ch = curl_init($supabaseUrl . '/rest/v1/orders?id=eq.' . $orderId);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        safeLog('error.log', "Failed to update order status. HTTP code: {$httpCode}, Response: {$response}");
        throw new Exception("Failed to update order status");
    }
    
    safeLog('payment_notifications.log', "Order {$orderId} updated with status: {$data->status}");
    
    // Return success response
    header('Content-Type: application/json');
    echo json_encode(['success' => true]);
    
} catch (Exception $e) {
    // Log error
    safeLog('payment_errors.log', "Notification error: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}