<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Log request for debugging
$logFile = __DIR__ . '/payment_log.txt';
$requestData = file_get_contents('php://input');
file_put_contents($logFile, date('Y-m-d H:i:s') . " - Request: " . $requestData . "\n", FILE_APPEND);

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Parse the JSON request body
$data = json_decode($requestData, true);

// Validate required fields
if (!isset($data['amount']) || !isset($data['reference']) || !isset($data['email'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit();
}

try {
    // Require the Maksekeskus SDK
    require __DIR__ . '/maksekeskus/vendor/autoload.php';
    use Maksekeskus\Maksekeskus;

    // Initialize Maksekeskus client
    $shopId = '4e2bed9a-aa24-4b87-801b-56c31c535d36';
    $publicKey = 'wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM';
    $privateKey = 'WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ';
    $testMode = false; // Set to false for production

    $MK = new Maksekeskus($shopId, $publicKey, $privateKey, $testMode);

    // Prepare transaction data
    $transactionData = [
        'transaction' => [
            'amount' => $data['amount'],
            'currency' => 'EUR',
            'reference' => $data['reference'],
            'merchant_data' => json_encode([
                'customer_name' => $data['firstName'] . ' ' . $data['lastName'],
                'customer_email' => $data['email'],
                'customer_phone' => $data['phone'] ?? '',
                'items' => $data['items'] ?? []
            ]),
            'return_url' => 'https://leen.ee/checkout/success',
            'cancel_url' => 'https://leen.ee/checkout',
            'notification_url' => 'https://leen.ee/php/payment-notification.php'
        ],
        'customer' => [
            'email' => $data['email'],
            'country' => substr($data['country'] ?? 'Estonia', 0, 2),
            'locale' => 'et'
        ]
    ];

    // Add IP address if available
    if (isset($_SERVER['REMOTE_ADDR'])) {
        $transactionData['customer']['ip'] = $_SERVER['REMOTE_ADDR'];
    }

    // Create transaction
    $transaction = $MK->createTransaction($transactionData);
    
    // Log the transaction response
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Transaction created: " . json_encode($transaction) . "\n", FILE_APPEND);

    // Create payment
    $paymentData = [
        'method' => $data['paymentMethod'] ?? 'swedbank',
        'locale' => 'et',
        'country' => substr($data['country'] ?? 'Estonia', 0, 2),
        'amount' => $data['amount'],
        'currency' => 'EUR',
        'return_url' => 'https://leen.ee/checkout/success',
        'cancel_url' => 'https://leen.ee/checkout'
    ];
    
    $payment = $MK->createPayment($transaction->id, $paymentData);
    
    // Log the payment response
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Payment created: " . json_encode($payment) . "\n", FILE_APPEND);

    // Return the payment URL
    echo json_encode([
        'transactionId' => $transaction->id,
        'paymentUrl' => $payment->payment_link
    ]);
} catch (Exception $e) {
    // Log the error
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Error: " . $e->getMessage() . "\n", FILE_APPEND);
    
    // Return error response
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}