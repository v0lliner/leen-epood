<?php
// This file handles payment notifications from Maksekeskus
header('Content-Type: application/json');

// Log the notification
$logFile = __DIR__ . '/notification_log.txt';
$requestData = file_get_contents('php://input');
file_put_contents($logFile, date('Y-m-d H:i:s') . " - Notification received: " . $requestData . "\n", FILE_APPEND);

// Require the Maksekeskus SDK
require __DIR__ . '/maksekeskus/vendor/autoload.php';
use Maksekeskus\Maksekeskus;

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
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Invalid MAC signature\n", FILE_APPEND);
    http_response_code(400);
    echo json_encode(['error' => 'Invalid signature']);
    exit();
}

try {
    // Extract the notification data
    $data = $MK->extractRequestData($request);
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Extracted data: " . json_encode($data) . "\n", FILE_APPEND);
    
    // Process the notification based on status
    // In a real implementation, you would update your database here
    
    // Return success response
    echo json_encode(['status' => 'success']);
} catch (Exception $e) {
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Error: " . $e->getMessage() . "\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}