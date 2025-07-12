<?php
// public/makse/korras.php
error_log("korras.php script started at " . date('Y-m-d H:i:s'));

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

// Log the request
safeLog('payment_success.log', "Payment success callback received: " . json_encode($_REQUEST));

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

// Get transaction reference (order ID) from request
$transactionReference = $_REQUEST['reference'] ?? null;

// Update order status if we have a reference
if ($transactionReference) {
    try {
        // Get Supabase configuration
        $supabaseUrl = $_ENV['SUPABASE_URL'] ?? null;
        $supabaseKey = $_ENV['SUPABASE_SERVICE_ROLE_KEY'] ?? null;
        
        if (!$supabaseUrl || !$supabaseKey) {
            safeLog('error.log', "Missing Supabase configuration");
            throw new Exception("Supabase configuration missing");
        }
        
        // Update order status to PAID
        $ch = curl_init($supabaseUrl . '/rest/v1/orders?id=eq.' . $transactionReference);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'status' => 'PAID',
            'payment_status' => 'COMPLETED'
        ]));
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
        } else {
            safeLog('payment_success.log', "Order {$transactionReference} status updated to PAID");
        }
    } catch (Exception $e) {
        safeLog('error.log', "Error updating order status: " . $e->getMessage());
    }
}

// Redirect to success page
header('Location: /makse/korras');