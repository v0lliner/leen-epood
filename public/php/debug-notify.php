<?php
// This is a debug script to test the payment notification flow
// It simulates a Maksekeskus notification and calls the payment-notification.php script

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set up logging
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}
$logFile = $logDir . '/debug_notify.log';

// Function to log messages
function debugLog($message, $data = null) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "$timestamp - $message";
    
    if ($data !== null) {
        $logEntry .= ": " . (is_string($data) ? $data : json_encode($data));
    }
    
    file_put_contents($logFile, $logEntry . "\n", FILE_APPEND);
}

// Create a test notification payload
$testReference = 'TEST-' . date('YmdHis');
$testAmount = 99.99;

$testPayload = [
    'json' => json_encode([
        'transaction' => $testReference,
        'status' => 'COMPLETED',
        'amount' => $testAmount,
        'currency' => 'EUR',
        'reference' => $testReference,
        'method' => 'card',
        'merchant_data' => json_encode([
            'customer_name' => 'Test Customer',
            'customer_email' => 'test@example.com',
            'customer_phone' => '+37255555555',
            'shipping_address' => 'Test Street 123',
            'shipping_city' => 'Tallinn',
            'shipping_postal_code' => '12345',
            'shipping_country' => 'Estonia',
            'deliveryMethod' => 'omniva-parcel-machine',
            'omnivaParcelMachineId' => '96091',
            'omnivaParcelMachineName' => 'Tallinn - Kristiine keskus',
            'items' => [
                [
                    'id' => '123e4567-e89b-12d3-a456-426614174000',
                    'title' => 'Test Product',
                    'price' => $testAmount,
                    'quantity' => 1
                ]
            ]
        ])
    ])
];

// Calculate MAC signature (this is a simplified version, not the actual algorithm)
$testPayload['mac'] = 'TEST_MAC_SIGNATURE';

debugLog("Starting debug notification test", $testPayload);

// Send the test notification to payment-notification.php
$ch = curl_init('http://' . $_SERVER['HTTP_HOST'] . '/php/payment-notification.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $testPayload);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

debugLog("Response from payment-notification.php", [
    'httpCode' => $httpCode,
    'response' => $response,
    'error' => $error
]);

// Output results
echo "<h1>Debug Notification Test</h1>";
echo "<h2>Request</h2>";
echo "<pre>" . json_encode($testPayload, JSON_PRETTY_PRINT) . "</pre>";
echo "<h2>Response</h2>";
echo "<p>HTTP Code: $httpCode</p>";
if ($error) {
    echo "<p>Error: $error</p>";
} else {
    echo "<pre>" . json_encode(json_decode($response), JSON_PRETTY_PRINT) . "</pre>";
}
echo "<p>Check the log file at: $logFile</p>";