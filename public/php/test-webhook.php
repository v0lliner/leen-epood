<?php
/**
 * Maksekeskus webhook test
 * 
 * This script simulates a Maksekeskus webhook notification
 * using the actual Maksekeskus API credentials.
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load utilities
require_once __DIR__ . '/utils/Logger.php';
require_once __DIR__ . '/utils/EnvLoader.php';

// Initialize logger
$logger = new Logger('TestWebhook', 'test_webhook.log');
$logger->info("Starting webhook test");

// Load environment variables
$envLoader = new EnvLoader($logger);
$envLoader->load();

// Require the Maksekeskus SDK
require_once __DIR__ . '/maksekeskus/vendor/autoload.php';
use Maksekeskus\Maksekeskus;

// Initialize Maksekeskus client with credentials
$shopId = $envLoader->get('MAKSEKESKUS_SHOP_ID', '4e2bed9a-aa24-4b87-801b-56c31c535d36');
$publicKey = $envLoader->get('MAKSEKESKUS_PUBLIC_KEY', 'wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM');
$privateKey = $envLoader->get('MAKSEKESKUS_PRIVATE_KEY', 'WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ');
$testMode = $envLoader->get('MAKSEKESKUS_TEST_MODE', 'false') === 'true';

$MK = new Maksekeskus($shopId, $publicKey, $privateKey, $testMode);

// Create test data
$testReference = 'TEST-' . date('YmdHis');
$testAmount = 99.99;
$testStatus = 'COMPLETED';

// Create JSON data for the notification
$jsonData = [
    'transaction' => $testReference,
    'status' => $testStatus,
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
];

// Calculate MAC signature
$mac = $MK->composeMac($jsonData);

// Create the request payload
$testPayload = [
    'json' => json_encode($jsonData),
    'mac' => $mac
];

$logger->info("Starting webhook test", $testPayload);

// Send the test notification to the payment-notification.php endpoint
$ch = curl_init('http://' . $_SERVER['HTTP_HOST'] . '/php/payment-notification.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $testPayload);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_VERBOSE, true);

$verbose = fopen('php://temp', 'w+');
curl_setopt($ch, CURLOPT_STDERR, $verbose);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

rewind($verbose);
$verboseLog = stream_get_contents($verbose);

curl_close($ch);

$logger->info("Response from webhook endpoint", [
    'httpCode' => $httpCode,
    'response' => $response,
    'error' => $error
]);

if ($verboseLog) {
    $logger->info("Curl verbose log", ['log' => $verboseLog]);
}

// Output results
?>
<!DOCTYPE html>
<html>
<head>
    <title>Maksekeskus Webhook Test</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 1200px; margin: 0 auto; }
        h1, h2, h3 { color: #2f3e9c; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background-color: #d4edda; color: #155724; }
        .failure { background-color: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <h1>Maksekeskus Webhook Test</h1>
    
    <h2>Request</h2>
    <pre><?php echo json_encode($testPayload, JSON_PRETTY_PRINT); ?></pre>
    
    <h2>Response</h2>
    <div class="status <?php echo $httpCode >= 200 && $httpCode < 300 ? 'success' : 'failure'; ?>">
        <p>HTTP Code: <?php echo $httpCode; ?></p>
        <?php if ($error): ?>
            <p>Error: <?php echo $error; ?></p>
        <?php else: ?>
            <pre><?php echo json_encode(json_decode($response), JSON_PRETTY_PRINT); ?></pre>
        <?php endif; ?>
    </div>
    
    <h2>Logs</h2>
    <p>Test log: <?php echo dirname(__DIR__) . '/logs/test_webhook.log'; ?></p>
    <p>Payment notification log: <?php echo dirname(__DIR__) . '/logs/payment_notification.log'; ?></p>
    
    <h2>Curl Verbose Log</h2>
    <pre><?php echo htmlspecialchars($verboseLog); ?></pre>
</body>
</html>