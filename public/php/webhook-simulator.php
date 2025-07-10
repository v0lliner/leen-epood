<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load environment variables
require_once __DIR__ . '/env-loader.php';

// Set up logging
$logDir = __DIR__ . '/../../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}
$logFile = $logDir . '/webhook_simulator.log';

// Function to log messages
function simulatorLog($message, $data = null) {
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

// Create a test notification payload
$testReference = 'TEST-' . date('YmdHis');
$testAmount = 0.20; // Use a small amount for testing

// Initialize Maksekeskus client for creating a valid MAC
$shopId = getenv('MAKSEKESKUS_SHOP_ID') ?: '4e2bed9a-aa24-4b87-801b-56c31c535d36';
$publicKey = getenv('MAKSEKESKUS_PUBLIC_KEY') ?: 'wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM';
$privateKey = getenv('MAKSEKESKUS_PRIVATE_KEY') ?: 'WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ';
$testMode = getenv('MAKSEKESKUS_TEST_MODE') === 'true'; // Default to false for production

$MK = new Maksekeskus($shopId, $publicKey, $privateKey, $testMode);

// Create JSON data for the notification
$jsonData = [
    'transaction' => $testReference,
    'status' => 'COMPLETED',
    'amount' => (string)$testAmount, // Convert to string to match real Maksekeskus format
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
                'price' => (float)$testAmount, // Convert to float to match expected format
                'quantity' => 1
            ]
        ]
    ])
];

// Create the request payload
$testPayload = [
    'json' => json_encode($jsonData)
];

// Calculate MAC signature
$mac = $MK->composeMac($jsonData);
$testPayload['mac'] = $mac;

simulatorLog("Starting webhook simulation test", $testPayload);

// Choose which endpoint to test
$targetEndpoint = isset($_GET['target']) && $_GET['target'] === 'production' 
    ? '/php/payment-notification.php' 
    : '/php/maksekeskus-test.php';

// Send the test notification to the target endpoint
$ch = curl_init('http://' . $_SERVER['HTTP_HOST'] . $targetEndpoint);

// Set verbose mode for debugging
$verbose = fopen('php://temp', 'w+');
curl_setopt($ch, CURLOPT_VERBOSE, true);
curl_setopt($ch, CURLOPT_STDERR, $verbose);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $testPayload);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

// Get verbose information
rewind($verbose);
$verboseLog = stream_get_contents($verbose);
fclose($verbose);
simulatorLog("Verbose curl output", $verboseLog);

curl_close($ch);

simulatorLog("Response from webhook endpoint", [
    'httpCode' => $httpCode,
    'response' => $response,
    'error' => $error
]);

// Output results
echo "<h1>Maksekeskus Webhook Simulator</h1>";
echo "<h2>Request</h2>";
echo "<pre>" . json_encode($testPayload, JSON_PRETTY_PRINT) . "</pre>";
echo "<h2>Response</h2>";
echo "<p>HTTP Code: $httpCode</p>";
if ($error) {
    echo "<p>Error: $error</p>";
} else {
    echo "<pre>" . htmlspecialchars($response) . "</pre>";
    echo "<h3>Parsed Response:</h3>";
    echo "<pre>" . json_encode(json_decode($response, true), JSON_PRETTY_PRINT) . "</pre>";
}

// Show links to logs
echo "<h2>Logs</h2>";
echo "<p>Simulator log: $logFile</p>";
echo "<p>Target endpoint log: " . $logDir . ($targetEndpoint === '/php/payment-notification.php' ? '/payment_notification.log' : '/maksekeskus_webhook_test.log') . "</p>";

// Add links to test different endpoints
echo "<h2>Check Logs</h2>";
echo "<p>Check the following log files for detailed information:</p>";
echo "<ul>";
echo "<li><a href='/php/check-webhook-logs.php' target='_blank'>View all webhook logs</a></li>";
echo "</ul>";

echo "<h2>Test Options</h2>";
echo "<p><a href='webhook-simulator.php?target=test'>Test maksekeskus-test.php endpoint</a></p>";
echo "<p><a href='webhook-simulator.php?target=production'>Test payment-notification.php endpoint</a></p>";