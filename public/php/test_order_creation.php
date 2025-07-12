<?php
// public/php/test_order_creation.php

// Set error reporting for development
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Load dependencies
require_once __DIR__ . '/payment/DotEnv.php';
require_once __DIR__ . '/supabase_client/SupabaseClient.php';

// Headers for JSON response
header('Content-Type: application/json');

/**
 * Safe logging function
 */
function safeLog($filename, $message) {
    $logDir = __DIR__ . '/payment/logs';
    if (!file_exists($logDir)) {
        mkdir($logDir, 0775, true);
    }
    
    $logFile = $logDir . '/' . $filename;
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[{$timestamp}] {$message}" . PHP_EOL;
    
    if (!file_put_contents($logFile, $logMessage, FILE_APPEND)) {
        error_log("Failed to write to log file {$logFile}. Message: {$message}");
    }
}

try {
    // Get Supabase configuration
    $supabaseUrl = DotEnv::get('SUPABASE_URL', 'https://epcenpirjkfkgdgxktrm.supabase.co');
    $supabaseKey = DotEnv::get('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY2VucGlyamtma2dkZ3hrdHJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4OTI0NzI1OCwiZXhwIjoyMDA0ODIzMjU4fQ.Wd0JvQDHHEVxKoL1gVQzZ_UwVF-_tx-g_vdAf-HSsSI');
    
    // Initialize Supabase client with service_role key
    $supabase = new SupabaseClient($supabaseUrl, $supabaseKey, true);
    
    // Check if RLS is enabled on orders table
    $isRlsEnabled = $supabase->isRlsEnabled('orders');
    echo "Orders table RLS status: " . ($isRlsEnabled ? "Enabled" : "Disabled") . "\n";
    
    // Sample order data for testing
    $testOrderData = [
        'customer_email' => 'test@example.com',
        'customer_name' => 'Test User',
        'customer_phone' => '+37255555555',
        'shipping_address' => json_encode([
            'country' => 'Estonia',
            'parcel_machine_id' => '12345',
            'parcel_machine_name' => 'Test Parcel Machine'
        ]),
        'items' => json_encode([
            [
                'id' => 'test-product-1',
                'title' => 'Test Product',
                'price' => '10.00€',
                'quantity' => 1
            ]
        ]),
        'subtotal' => 10.00,
        'shipping_cost' => 3.99,
        'total_amount' => 13.99,
        'status' => 'PENDING',
        'payment_status' => 'PENDING',
        'payment_method' => 'test_bank',
        'notes' => 'Test order'
    ];
    
    // Insert test order
    $result = $supabase->insert('orders', $testOrderData);
    
    // Output result
    echo "Test order created successfully!\n";
    echo "Order ID: " . $result[0]->id . "\n";
    
    echo json_encode([
        'success' => true,
        'message' => 'Test order created successfully',
        'order_id' => $result[0]->id,
        'rls_enabled' => $isRlsEnabled
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}