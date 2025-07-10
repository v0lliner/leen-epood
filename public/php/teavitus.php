<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them

// Set up logging
$logDir = __DIR__ . '/../../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}
$logFile = $logDir . '/maksekeskuse_teavitus.log';

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
    // Log the notification
    logMessage("Teavitus saabunud", $_REQUEST);
    logMessage("RAW", file_get_contents('php://input'));
    
    // Initialize Maksekeskus client
    $shopId = '4e2bed9a-aa24-4b87-801b-56c31c535d36';
    $publicKey = 'wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM';
    $privateKey = 'WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ';
    $testMode = false; // Set to false for production
    
    $MK = new Maksekeskus($shopId, $publicKey, $privateKey, $testMode);
    
    // Verify the notification
    $request = $_REQUEST;
    logMessage("Kontrollime MAC signatuuri", $request);
    $isValid = $MK->verifyMac($request);
    
    if (!$isValid) {
        logMessage("Vigane MAC signatuur", $request);
        http_response_code(400);
        echo json_encode(['error' => 'Invalid signature']);
        exit();
    }
    
    logMessage("MAC signatuur edukalt kontrollitud");
    
    // Extract the notification data
    $data = $MK->extractRequestData($request, true);
    logMessage("Andmed edukalt ekstraktitud", $data);
    
    // Get the transaction ID, reference and status
    $transactionId = isset($data['transaction']) ? $data['transaction'] : null;
    $reference = isset($data['reference']) ? $data['reference'] : null;
    $status = isset($data['status']) ? $data['status'] : null;
    
    logMessage("Tehingu andmed", [
        "transactionId" => $transactionId,
        "reference" => $reference,
        "status" => $status
    ]);
    
    if (!$transactionId) {
        logMessage("Tehingu ID puudub teavituses", $data);
        http_response_code(400);
        echo json_encode(['error' => 'Missing transaction ID']);
        exit();
    }
    
    // Fetch the full transaction details from Maksekeskus
    try {
        $transaction = $MK->getTransaction($transactionId);
        logMessage("Tehingu detailid laaditud", $transaction);
        
        // Process the order in our database
        require_once __DIR__ . '/process-order.php';
        $success = processOrder($transaction, $data);
        
        if ($success) {
            logMessage("Tellimus edukalt töödeldud");
            echo json_encode(['status' => 'success']);
        } else {
            logMessage("Tellimuse töötlemine ebaõnnestus");
            http_response_code(500);
            echo json_encode(['error' => 'Order processing failed']);
        }
    } catch (\Exception $e) {
        logMessage("Viga tehingu detailide laadimisel", $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch transaction details']);
        exit();
    }
} catch (\Exception $e) {
    logMessage("Üldine viga", $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}