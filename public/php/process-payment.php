<?php
// Enable detailed error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Require the Maksekeskus SDK at the top
require __DIR__ . '/maksekeskus/vendor/autoload.php';
use Maksekeskus\Maksekeskus;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Log request for debugging
$logFile = __DIR__ . '/payment_log.txt';
$requestData = file_get_contents('php://input');
file_put_contents($logFile, date('Y-m-d H:i:s') . " - Request: " . $requestData . "\n", FILE_APPEND);

try {
    // Parse the JSON request body
    $data = json_decode($requestData, true);
    
    // Check for JSON parsing errors
    if (json_last_error() !== JSON_ERROR_NONE) {
        file_put_contents($logFile, date('Y-m-d H:i:s') . " - JSON decode error: " . json_last_error_msg() . "\n", FILE_APPEND);
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON data: ' . json_last_error_msg()]);
        exit();
    }
    
    // Log parsed data for debugging
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Parsed data: " . json_encode($data) . "\n", FILE_APPEND);

    // Validate required fields for all payment methods
    if (!isset($data['amount']) || !isset($data['reference']) || !isset($data['email']) || !isset($data['paymentMethod'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        file_put_contents($logFile, date('Y-m-d H:i:s') . " - Error: Missing required fields\n", FILE_APPEND);
        exit();
    }

    // Validate token for card payments
    if ($data['paymentMethod'] === 'card' && (!isset($data['token']) || empty($data['token']))) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing token for card payment']);
        file_put_contents($logFile, date('Y-m-d H:i:s') . " - Error: Missing token for card payment\n", FILE_APPEND);
        exit();
    }

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

    // Prepare payment data
    $paymentData = [
        // Use the payment method from the request
        'method' => $data['paymentMethod'],
        'locale' => 'et',
        'country' => substr($data['country'] ?? 'Estonia', 0, 2),
        'amount' => $data['amount'],
        'currency' => 'EUR',
        'return_url' => 'https://leen.ee/checkout/success',
        'cancel_url' => 'https://leen.ee/checkout'
    ];

    // Add token if provided (required for card payments)
    if (isset($data['token']) && !empty($data['token'])) {
        $paymentData['token'] = $data['token'];
        file_put_contents($logFile, date('Y-m-d H:i:s') . " - Token included in payment data\n", FILE_APPEND);
    }
    
    // Create payment
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
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Detailed error: " . $e->getMessage() . "\n", FILE_APPEND);
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Stack trace: " . $e->getTraceAsString() . "\n", FILE_APPEND);
    
    // Return error response
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}