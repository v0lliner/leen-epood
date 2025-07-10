<?php
// This is a test page to simulate payment return data
// It will display a form that simulates the payment return POST request

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load environment variables
require_once __DIR__ . '/env-loader.php';

// Set up logging
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}
$logFile = $logDir . '/test_makse_tagastus.log';

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

// Initialize Maksekeskus client with your credentials
$shopId = getenv('MAKSEKESKUS_SHOP_ID') ?: '4e2bed9a-aa24-4b87-801b-56c31c535d36';
$publicKey = getenv('MAKSEKESKUS_PUBLIC_KEY') ?: 'wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM';
$privateKey = getenv('MAKSEKESKUS_PRIVATE_KEY') ?: 'WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ';
$testMode = getenv('MAKSEKESKUS_TEST_MODE') === 'true'; // Default to false for production

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

// Process form submission
$result = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['send_test'])) {
    logMessage("Saadame testimiseks päringu", $testPayload);
    
    // Send the test notification to the target endpoint
    $targetUrl = isset($_POST['target_url']) ? $_POST['target_url'] : '/php/teavitus.php';
    $ch = curl_init('http://' . $_SERVER['HTTP_HOST'] . $targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $testPayload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);

    curl_close($ch);

    logMessage("Vastus teavituse endpointist", [
        'httpCode' => $httpCode,
        'response' => $response,
        'error' => $error
    ]);
    
    $result = [
        'httpCode' => $httpCode,
        'response' => $response,
        'error' => $error
    ];
}

// HTML output
?>
<!DOCTYPE html>
<html>
<head>
    <title>Maksekeskuse teavituse test</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 1000px; margin: 0 auto; }
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
    <h1>Maksekeskuse teavituse test</h1>
    
    <div class="container">
        <h2>Testi kirjeldus</h2>
        <p>See leht simuleerib Maksekeskuse teavitust, mis saadetakse pärast edukat makset. 
        Saate testida, kas teie teavituse töötlemise loogika töötab korrektselt.</p>
    </div>
    
    <div class="container">
        <h2>Testimise vorm</h2>
        <form method="post">
            <div class="form-group">
                <label for="target_url">Sihtpunkt URL (vaikimisi /php/teavitus.php):</label>
                <input type="text" id="target_url" name="target_url" value="/php/teavitus.php">
            </div>
            <button type="submit" name="send_test">Saada testpäring</button>
        </form>
    </div>
    
    <?php if ($result): ?>
    <div class="container">
        <h2>Testi tulemus</h2>
        <div class="result <?php echo $result['httpCode'] >= 200 && $result['httpCode'] < 300 ? 'success' : 'error'; ?>">
            <h3>HTTP kood: <?php echo $result['httpCode']; ?></h3>
            <?php if ($result['error']): ?>
                <p>Viga: <?php echo $result['error']; ?></p>
            <?php else: ?>
                <h4>Vastus:</h4>
                <pre><?php echo $result['response']; ?></pre>
            <?php endif; ?>
        </div>
    </div>
    <?php endif; ?>
    
    <div class="container">
        <h2>Testimisandmed</h2>
        <h3>Päring, mis saadetakse:</h3>
        <pre><?php echo json_encode($testPayload, JSON_PRETTY_PRINT); ?></pre>
        
        <h3>Dekodeeritud JSON andmed:</h3>
        <pre><?php echo json_encode($jsonData, JSON_PRETTY_PRINT); ?></pre>
        
        <h3>MAC signatuur:</h3>
        <pre><?php echo $mac; ?></pre>
    </div>
    
    <div class="container">
        <h2>Logifail</h2>
        <p>Logifail asub: <code><?php echo $logFile; ?></code></p>
        <?php if (file_exists($logFile)): ?>
            <h3>Viimased logikanded:</h3>
            <pre><?php echo htmlspecialchars(file_get_contents($logFile, false, null, -8192)); ?></pre>
        <?php else: ?>
            <p class="info">Logifaili pole veel loodud.</p>
        <?php endif; ?>
    </div>
    
    <div class="container">
        <h2>Kasulikud lingid</h2>
        <ul>
            <li><a href="/php/teavitus.php" target="_blank">Teavituse endpoint</a></li>
            <li><a href="/php/phpinfo.php" target="_blank">PHP info</a></li>
            <li><a href="/makse/korras" target="_blank">Õnnestunud makse leht</a></li>
            <li><a href="/makse/katkestatud" target="_blank">Katkestatud makse leht</a></li>
        </ul>
    </div>
</body>
</html>