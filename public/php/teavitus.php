<?php
/**
 * Payment notification handler for Maksekeskus
 * 
 * This script receives payment notifications from Maksekeskus,
 * verifies their authenticity, and processes the payment data
 * to create or update orders in the database.
 */

// Initialize error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them

// Load utilities
require_once __DIR__ . '/utils/Logger.php';
require_once __DIR__ . '/utils/EnvLoader.php';
require_once __DIR__ . '/utils/SupabaseClient.php';
require_once __DIR__ . '/utils/PaymentProcessor.php';

// Initialize logger
$logger = new Logger('PaymentNotification', 'payment_notification.log');
$logger->info("Payment notification received", [
    'time' => date('Y-m-d H:i:s'),
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown'
]);

// Set content type to JSON
header('Content-Type: application/json');

try {
    // Load environment variables
    $envLoader = new EnvLoader($logger);
    if (!$envLoader->load()) {
        throw new Exception("Failed to load environment variables");
    }
    
    // Validate required environment variables
    $requiredVars = [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'MAKSEKESKUS_SHOP_ID',
        'MAKSEKESKUS_PUBLIC_KEY',
        'MAKSEKESKUS_PRIVATE_KEY'
    ];
    
    if (!$envLoader->validateRequired($requiredVars)) {
        throw new Exception("Missing required environment variables");
    }
    
    // Initialize Supabase client
    $supabase = new SupabaseClient(
        $envLoader->getRequired('SUPABASE_URL'),
        $envLoader->getRequired('SUPABASE_SERVICE_ROLE_KEY'),
        $logger
    );
    
    // Initialize payment processor
    $paymentProcessor = new PaymentProcessor(
        $envLoader->getRequired('MAKSEKESKUS_SHOP_ID'),
        $envLoader->getRequired('MAKSEKESKUS_PUBLIC_KEY'),
        $envLoader->getRequired('MAKSEKESKUS_PRIVATE_KEY'),
        $envLoader->get('MAKSEKESKUS_TEST_MODE') === 'true',
        $supabase,
        $logger
    );
    
    // Log the raw request data for debugging
    $logger->info("Payment notification raw data", [
        'POST' => $_POST,
        'GET' => $_GET,
        'REQUEST' => $_REQUEST,
        'RAW' => file_get_contents('php://input')
    ]);
    
    // Verify the notification signature
    if (!$paymentProcessor->verifySignature($_REQUEST)) {
        $logger->error("Invalid MAC signature");
        http_response_code(400);
        echo json_encode(['error' => 'Invalid signature']);
        exit();
    }
    
    $logger->info("MAC signature verified successfully");
    
    // Extract the payment data
    $paymentData = $paymentProcessor->extractPaymentData($_REQUEST);
    
    if (!$paymentData) {
        $logger->error("Failed to extract payment data");
        http_response_code(400);
        echo json_encode(['error' => 'Failed to extract payment data']);
        exit();
    }
    
    $logger->info("Payment data extracted successfully", [
        'transaction' => $paymentData->transaction ?? null,
        'reference' => $paymentData->reference ?? null,
        'status' => $paymentData->status ?? null
    ]);
    
    // Process the payment notification
    $result = $paymentProcessor->processPaymentNotification($paymentData);
    
    if (!$result['success']) {
        $logger->error("Payment processing failed", $result);
        http_response_code(500);
        echo json_encode([
            'error' => 'Payment processing failed',
            'message' => $result['message'] ?? 'Unknown error'
        ]);
        exit();
    }
    
    $logger->info("Payment processed successfully", $result);
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Payment notification received and processed successfully',
        'order_id' => $result['order_id'] ?? null,
        'transaction_id' => $paymentData->transaction ?? null,
        'reference' => $paymentData->reference ?? null
    ]);
    
    // Ensure all output is flushed
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    }
    
} catch (Exception $e) {
    $logger->exception($e, "Exception in payment notification handler");
    
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}

// Final log entry to confirm script completion
$logger->info("Payment notification handler completed");