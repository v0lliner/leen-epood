<?php
// public/makse/katkestatud.php
error_log("katkestatud.php script started at " . date('Y-m-d H:i:s'));

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

// Log the request
safeLog('payment_cancel.log', "Payment cancel callback received: " . json_encode($_REQUEST));

// Get transaction reference (order ID) from request
$transactionReference = $_REQUEST['reference'] ?? null;

// Update order status if we have a reference
if ($transactionReference) {
    try {
        // Get Supabase configuration
        $supabaseUrl = DotEnv::get('SUPABASE_URL', 'https://epcenpirjkfkgdgxktrm.supabase.co');
        $supabaseKey = DotEnv::get('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY2VucGlyamtma2dkZ3hrdHJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4OTI0NzI1OCwiZXhwIjoyMDA0ODIzMjU4fQ.Wd0JvQDHHEVxKoL1gVQzZ_UwVF-_tx-g_vdAf-HSsSI');

        // Initialize Supabase client with service_role key
        $supabase = new SupabaseClient($supabaseUrl, $supabaseKey, true);

        // Update order status to CANCELLED
        $result = $supabase->update('orders', $transactionReference, [
            'status' => 'CANCELLED',
            'payment_status' => 'CANCELLED'
        ]);

        safeLog('payment_cancel.log', "Order {$transactionReference} status updated to CANCELLED");
    } catch (Exception $e) {
        safeLog('error.log', "Error updating order status: " . $e->getMessage());
    }
}

// Redirect to cancel page
header('Location: /makse/katkestatud');