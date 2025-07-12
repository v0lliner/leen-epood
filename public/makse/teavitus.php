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

// Load custom DotEnv class
require_once __DIR__ . '/../php/payment/DotEnv.php';
require_once __DIR__ . '/../php/supabase_client/SupabaseClient.php';

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
    $supabaseUrl = DotEnv::get('SUPABASE_URL', 'https://epcenpirjkfkgdgxktrm.supabase.co');
    $supabaseKey = DotEnv::get('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY2VucGlyamtma2dkZ3hrdHJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4OTI0NzI1OCwiZXhwIjoyMDA0ODIzMjU4fQ.Wd0JvQDHHEVxKoL1gVQzZ_UwVF-_tx-g_vdAf-HSsSI');

    // Initialize Supabase client with service_role key
    $supabase = new SupabaseClient($supabaseUrl, $supabaseKey, true);

    // Update order status
    $updateData = [
        'payment_status' => $data->status ?? 'PENDING',
        'status' => ($data->status === 'COMPLETED') ? 'PAID' : 'PENDING'
    ];

    // Update order using SupabaseClient
    $result = $supabase->update('orders', $orderId, $updateData);
    
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