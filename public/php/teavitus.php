<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them

// Set up logging
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0777, true);
}
$logFile = $logDir . '/maksekeskus_teavitus.log';

// Function to log messages
function logMessage($message, $data = null) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "$timestamp - $message";
    
    if ($data !== null) {
        $logEntry .= ": " . (is_string($data) ? $data : json_encode($data));
    }
    
    $result = file_put_contents($logFile, $logEntry . "\n", FILE_APPEND);
    if ($result === false) {
        error_log("Failed to write to log file: $logFile");
    }
}

// Log all incoming data for debugging
logMessage("Teavitus saabunud", [
    'POST' => $_POST,
    'GET' => $_GET,
    'RAW' => file_get_contents('php://input')
]);

// Require the Maksekeskus SDK
require __DIR__ . '/maksekeskus/vendor/autoload.php';
use Maksekeskus\Maksekeskus;

// Initialize Maksekeskus client with your credentials
$shopId = '4e2bed9a-aa24-4b87-801b-56c31c535d36';
$publicKey = 'wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM';
$privateKey = 'WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ';
$testMode = false; // Set to false for production

try {
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
    $data = $MK->extractRequestData($request);
    logMessage("Andmed edukalt ekstraktitud", $data);
    
    // Get the transaction ID
    $transactionId = isset($data['transaction']) ? $data['transaction'] : null;
    $reference = isset($data['reference']) ? $data['reference'] : null;
    $status = isset($data['status']) ? $data['status'] : null;
    
    logMessage("Tehingu andmed", [
        'transactionId' => $transactionId,
        'reference' => $reference,
        'status' => $status
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
        logMessage("Tehingu detailid edukalt laaditud", $transaction);
        
        // Process the order in database
        if ($status === 'COMPLETED') {
            logMessage("Makse on COMPLETED staatuses, töötleme tellimust");
            
            // Extract merchant data
            $merchantData = json_decode($transaction->transaction->merchant_data ?? '{}', true);
            logMessage("Kaupmeheandmed", $merchantData);
            
            // Here you would update your database with the order status
            // For now, we'll just log the success
            logMessage("Tellimus edukalt töödeldud", [
                'reference' => $reference,
                'status' => $status,
                'amount' => $data->amount ?? null,
                'currency' => $data->currency ?? null
            ]);
            
            // You can add here:
            // 1. Database update logic
            // 2. Email notification to customer
            // 3. Email notification to admin
            // 4. Inventory update
            // 5. Shipping registration
            
            // Return success response
            echo json_encode([
                'status' => 'success',
                'message' => 'Payment notification processed successfully'
            ]);
        } else {
            logMessage("Makse ei ole COMPLETED staatuses", [
                'status' => $status,
                'reference' => $reference
            ]);
            
            // Return success response but note the status
            echo json_encode([
                'status' => 'success',
                'message' => 'Payment notification received but status is not COMPLETED',
                'payment_status' => $status
            ]);
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