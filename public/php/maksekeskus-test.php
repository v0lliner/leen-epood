<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them

// Set content type to JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Set up logging
$logDir = __DIR__ . '/../../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}
$logFile = $logDir . '/maksekeskus_webhook_test.log';

// Function to log messages
function logMessage($message, $data = null) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "$timestamp - $message";
    
    if ($data !== null) {
        $logEntry .= ": " . (is_string($data) ? $data : json_encode($data));
    }
    
    file_put_contents($logFile, $logEntry . "\n", FILE_APPEND);
}

// Require the Maksekeskus SDK
require __DIR__ . '/maksekeskus/vendor/autoload.php';
use Maksekeskus\Maksekeskus;

// Main execution starts here
try {
    // Check if this is a GET request (for testing the endpoint)
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        logMessage("GET request received - Endpoint test");
        echo json_encode([
            'status' => 'success',
            'message' => 'Maksekeskus webhook endpoint is working',
            'time' => date('Y-m-d H:i:s')
        ]);
        exit();
    }

    // Log the notification
    $requestData = file_get_contents('php://input');
    logMessage("Webhook received (raw input)", $requestData);
    logMessage("Request method", $_SERVER['REQUEST_METHOD']);
    logMessage("Request headers", getallheaders());
    
    // Log the $_REQUEST data
    logMessage("REQUEST data", $_REQUEST);

    // Initialize Maksekeskus client
    $shopId = '4e2bed9a-aa24-4b87-801b-56c31c535d36';
    $publicKey = 'wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM';
    $privateKey = 'WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ';
    $testMode = false; // Set to false for production
    
    $MK = new Maksekeskus($shopId, $publicKey, $privateKey, $testMode);
    
    // Verify the notification
    $request = $_REQUEST;
    $isValid = $MK->verifyMac($request);
    
    if (!$isValid) {
        logMessage("Invalid MAC signature", $request);
        http_response_code(400);
        echo json_encode(['error' => 'Invalid signature']);
        exit();
    }
    
    logMessage("MAC signature verified successfully");
    
    // Extract the notification data
    $data = $MK->extractRequestData($request);
    logMessage("Extracted data", $data);
    
    // Get the transaction ID
    $transactionId = $data->transaction ?? null;
    $reference = $data->reference ?? null;

    if (!$transactionId) {
        logMessage("No transaction ID in notification", $data);
        http_response_code(400);
        echo json_encode(['error' => 'Missing transaction ID']);
        exit();
    }
    
    logMessage("Transaction ID", $transactionId);
    logMessage("Reference", $reference);
    
    // Fetch the full transaction details from Maksekeskus
    try {
        $transaction = $MK->getTransaction($transactionId);
        logMessage("Transaction details fetched", $transaction);
        
        // Extract merchant data
        $merchantData = json_decode($transaction->transaction->merchant_data ?? '{}', true);
        logMessage("Merchant data", $merchantData);
        
        // Return success response
        echo json_encode([
            'status' => 'success',
            'message' => 'Webhook received and processed successfully',
            'transactionId' => $transactionId,
            'reference' => $reference
        ]);
    } catch (\Exception $e) {
        logMessage("Error fetching transaction details", $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch transaction details']);
        exit();
    }
} catch (\Exception $e) {
    logMessage("Exception", $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}