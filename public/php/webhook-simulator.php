<?php
/**
 * Maksekeskus webhook simulator
 * 
 * This script simulates a Maksekeskus webhook notification
 * for testing the payment notification handler.
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load utilities
require_once __DIR__ . '/utils/Logger.php';
require_once __DIR__ . '/utils/EnvLoader.php';

// Initialize logger
$logger = new Logger('WebhookSimulator', 'webhook_simulator.log');
$logger->info("Starting webhook simulation");

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

$logger->info("Webhook test payload created", [
    'reference' => $testReference,
    'amount' => $testAmount
]);

// Determine the target endpoint
$targetEndpoint = isset($_GET['target']) && $_GET['target'] === 'production' 
    ? '/php/payment-notification.php' 
    : '/php/teavitus.php';

$logger->info("Sending webhook test to endpoint", ['endpoint' => $targetEndpoint]);

// Send the test notification to the payment-notification.php endpoint
$ch = curl_init('http://' . $_SERVER['HTTP_HOST'] . $targetEndpoint);
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

$logger->info("Webhook test response", [
    'httpCode' => $httpCode,
    'response' => $response,
    'error' => $error
]);

if ($verboseLog) {
    $logger->info("Curl verbose log", ['log' => $verboseLog]);
}

// Output HTML
?>
<!DOCTYPE html>
<html>
<head>
    <title>Maksekeskus Webhook Test</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 1200px; margin: 0 auto; }
        h1, h2, h3 { color: #2f3e9c; }
        .container { margin-bottom: 30px; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input[type="text"] { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #2f3e9c; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        button:hover { opacity: 0.9; }
        .result { margin-top: 20px; padding: 15px; border-radius: 5px; }
        .success { background-color: #d4edda; color: #155724; }
        .error { background-color: #f8d7da; color: #721c24; }
        .info { background-color: #e2e3e5; color: #383d41; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 10px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Maksekeskus Webhook Test</h1>
    
    <div class="container">
        <h2>Test Results</h2>
        <div class="result <?php echo $httpCode >= 200 && $httpCode < 300 ? 'success' : 'error'; ?>">
            <h3>HTTP Code: <?php echo $httpCode; ?></h3>
            <?php if ($error): ?>
                <p>Error: <?php echo $error; ?></p>
            <?php else: ?>
                <h4>Response:</h4>
                <pre><?php echo $response; ?></pre>
            <?php endif; ?>
        </div>
    </div>
    
    <div class="container">
        <h2>Test Data</h2>
        <h3>Request Payload:</h3>
        <pre><?php echo json_encode($testPayload, JSON_PRETTY_PRINT); ?></pre>
        
        <h3>JSON Data:</h3>
        <pre><?php echo json_encode($jsonData, JSON_PRETTY_PRINT); ?></pre>
        
        <h3>MAC Signature:</h3>
        <pre><?php echo $mac; ?></pre>
    </div>
    
    <div class="container">
        <h2>Log Files</h2>
        <p>Check these log files for detailed information:</p>
        <ul>
            <li>Webhook Simulator Log: <code><?php echo dirname(__DIR__) . '/logs/webhook_simulator.log'; ?></code></li>
            <li>Payment Notification Log: <code><?php echo dirname(__DIR__) . '/logs/payment_notification.log'; ?></code></li>
            <li>Environment Loader Log: <code><?php echo dirname(__DIR__) . '/logs/env_loader.log'; ?></code></li>
        </ul>
        
        <?php
        // Check if log files exist and are readable
        $logFiles = [
            'webhook_simulator.log',
            'payment_notification.log',
            'env_loader.log'
        ];
        
        echo "<h3>Log File Status:</h3>";
        echo "<table>";
        echo "<tr><th>Log File</th><th>Exists</th><th>Readable</th><th>Size</th><th>Last Modified</th></tr>";
        
        foreach ($logFiles as $file) {
            $path = dirname(__DIR__) . '/logs/' . $file;
            $exists = file_exists($path);
            $readable = is_readable($path);
            $size = $exists ? filesize($path) : 0;
            $modified = $exists ? date("Y-m-d H:i:s", filemtime($path)) : 'N/A';
            
            echo "<tr>";
            echo "<td>{$file}</td>";
            echo "<td>" . ($exists ? "Yes" : "No") . "</td>";
            echo "<td>" . ($readable ? "Yes" : "No") . "</td>";
            echo "<td>" . ($exists ? number_format($size) . " bytes" : "N/A") . "</td>";
            echo "<td>{$modified}</td>";
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>
    
    <div class="container">
        <h2>Test Options</h2>
        <p><a href="webhook-simulator.php?target=direct">Test teavitus.php endpoint</a></p>
        <p><a href="webhook-simulator.php?target=production">Test payment-notification.php endpoint</a></p>
    </div>
</body>
</html>