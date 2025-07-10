<?php
// Enable detailed error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1); 

// Load environment variables
require_once __DIR__ . '/env-loader.php';

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

// Test if log file is writable
if (!is_writable($logFile)) {
    // Try to create the file if it doesn't exist
    if (!file_exists($logFile)) {
        touch($logFile);
        chmod($logFile, 0666);
    }
    // Check again after attempting to fix
    if (!is_writable($logFile)) {
        echo json_encode(['error' => 'Log file is not writable: ' . $logFile]);
        exit();
    }
}

// Log the request with error handling
try {
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Request: " . $requestData . "\n", FILE_APPEND);
} catch (Exception $e) {
    echo json_encode(['error' => 'Failed to write to log file: ' . $e->getMessage()]);
    exit();
}

try {
    // Parse the JSON request body
    $data = json_decode($requestData, true);
    
    // Check if we have the required environment variables
    if (!getenv('MAKSEKESKUS_SHOP_ID') || !getenv('MAKSEKESKUS_PUBLIC_KEY') || !getenv('MAKSEKESKUS_PRIVATE_KEY')) {
        // Try to load from .env file if it exists
        if (file_exists(__DIR__ . '/../../.env')) {
            $envFile = file_get_contents(__DIR__ . '/../../.env');
            
            preg_match('/MAKSEKESKUS_SHOP_ID=([^\n]+)/', $envFile, $shopIdMatches);
            if (isset($shopIdMatches[1])) {
                putenv('MAKSEKESKUS_SHOP_ID=' . $shopIdMatches[1]);
            }
            
            preg_match('/MAKSEKESKUS_PUBLIC_KEY=([^\n]+)/', $envFile, $publicKeyMatches);
            if (isset($publicKeyMatches[1])) {
                putenv('MAKSEKESKUS_PUBLIC_KEY=' . $publicKeyMatches[1]);
            }
            
            preg_match('/MAKSEKESKUS_PRIVATE_KEY=([^\n]+)/', $envFile, $privateKeyMatches);
            if (isset($privateKeyMatches[1])) {
                putenv('MAKSEKESKUS_PRIVATE_KEY=' . $privateKeyMatches[1]);
            }
            
            preg_match('/MAKSEKESKUS_TEST_MODE=([^\n]+)/', $envFile, $testModeMatches);
            if (isset($testModeMatches[1])) {
                putenv('MAKSEKESKUS_TEST_MODE=' . $testModeMatches[1]);
            }
        }
    }
    
    // Check for JSON parsing errors
    if (json_last_error() !== JSON_ERROR_NONE) {
        file_put_contents($logFile, date('Y-m-d H:i:s') . " - JSON decode error: " . json_last_error_msg() . "\n", FILE_APPEND);
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON data: ' . json_last_error_msg()]);
        exit();
    }
    
    // Log parsed data for debugging
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Parsed data: " . json_encode($data) . "\n", FILE_APPEND);

   // Define proper country code mapping
   $countryCodeMap = [
       'Estonia' => 'ee',
       'Latvia' => 'lv',
       'Lithuania' => 'lt',
       'Finland' => 'fi'
   ];
   
   // Get the correct country code from the map, default to 'ee' if not found
   $countryCode = $countryCodeMap[$data['country'] ?? 'Estonia'] ?? 'ee';
   file_put_contents($logFile, date('Y-m-d H:i:s') . " - Country: " . ($data['country'] ?? 'Estonia') . ", Mapped country code: " . $countryCode . "\n", FILE_APPEND);

    // Validate required fields for all payment methods
    if (!isset($data['amount']) || !isset($data['reference']) || !isset($data['email']) || !isset($data['paymentMethod'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        file_put_contents($logFile, date('Y-m-d H:i:s') . " - Error: Missing required fields\n", FILE_APPEND);
        exit();
    }

    // Validate token for card payments
    if ($data['paymentMethod'] === 'card' && (!isset($data['token']) || empty($data['token']))) {
        // Check if this is a test card payment
        if ($data['paymentMethod'] === 'test_card') {
            // For test card, we'll use a predefined token
            $data['token'] = 'test_token_card_success';
            file_put_contents($logFile, date('Y-m-d H:i:s') . " - Using test card token\n", FILE_APPEND);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Missing token for card payment']);
            file_put_contents($logFile, date('Y-m-d H:i:s') . " - Error: Missing token for card payment\n", FILE_APPEND);
            exit();
        }
    }

    // Initialize Maksekeskus client
    $shopId = getenv('MAKSEKESKUS_SHOP_ID') ?: '4e2bed9a-aa24-4b87-801b-56c31c535d36';
    $publicKey = getenv('MAKSEKESKUS_PUBLIC_KEY') ?: 'wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM';
    $privateKey = getenv('MAKSEKESKUS_PRIVATE_KEY') ?: 'WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ';
    $testMode = getenv('MAKSEKESKUS_TEST_MODE') === 'true'; // Default to false for production

    $MK = new Maksekeskus($shopId, $publicKey, $privateKey, $testMode);

    // Prepare transaction data
    $transactionData = [
        'transaction' => [
            'amount' => (float)$data['amount'],
            'currency' => 'EUR',
            'reference' => $data['reference'], // This will be used as order_number in the return URL
            'notification_url' => 'https://leen.ee/php/payment-notification.php', // Webhook URL for payment notifications
            'merchant_data' => json_encode([
                'customer_name' => $data['firstName'] . ' ' . $data['lastName'],
                'customer_email' => $data['email'],
                'customer_phone' => $data['phone'] ?? '',
                'items' => $data['items'] ?? [],
                'deliveryMethod' => $data['deliveryMethod'] ?? null,
                'omnivaParcelMachineId' => $data['omnivaParcelMachineId'] ?? null,
                'omnivaParcelMachineName' => $data['omnivaParcelMachineName'] ?? null
            ]),
            'return_url' => 'https://leen.ee/checkout/success',
            'cancel_url' => 'https://leen.ee/checkout',
            'notification_url' => 'https://leen.ee/php/payment-notification.php'
        ],
        'customer' => [
            'email' => $data['email'],
            'country' => $countryCode,
            'locale' => 'et'
        ]
    ];

    // If return_url is provided in the request, use it instead of the default
    if (isset($data['return_url']) && !empty($data['return_url'])) {
        $transactionData['transaction']['return_url'] = $data['return_url'];
    }

    // If cancel_url is provided in the request, use it instead of the default
    if (isset($data['cancel_url']) && !empty($data['cancel_url'])) {
        $transactionData['transaction']['cancel_url'] = $data['cancel_url'];
    }

    // Add token for card payments if present
    if (($data['paymentMethod'] === 'card' || $data['paymentMethod'] === 'test_card') && isset($data['token'])) {
        $transactionData['transaction']['token'] = $data['token'];
        
        // If this is a test card, set test mode to true
        if ($data['paymentMethod'] === 'test_card') {
            $testMode = true;
            $MK = new Maksekeskus($shopId, $publicKey, $privateKey, $testMode);
            file_put_contents($logFile, date('Y-m-d H:i:s') . " - Switched to test mode for test card payment\n", FILE_APPEND);
        }
    }

    // Add IP address if available
    if (isset($_SERVER['REMOTE_ADDR'])) {
        $transactionData['customer']['ip'] = $_SERVER['REMOTE_ADDR'];
    }

    // Create transaction
    $transaction = $MK->createTransaction($transactionData);
    
    // Log the transaction response
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Transaction created: " . json_encode($transaction) . "\n", FILE_APPEND);

    // Extract payment URL based on the selected payment method
    $paymentUrl = null;
    $paymentMethod = $data['paymentMethod'];
    
    // For test card, we need to handle it differently
    if ($paymentMethod === 'test_card') {
        // For test cards, we should have a direct URL in the transaction response
        if (isset($transaction->payment_url)) {
            $paymentUrl = $transaction->payment_url;
            file_put_contents($logFile, date('Y-m-d H:i:s') . " - Using direct payment URL for test card: " . $paymentUrl . "\n", FILE_APPEND);
        } else {
            // Fallback to redirect URL if available
            foreach ($transaction->payment_methods->other as $other) {
                if ($other->name === 'redirect') {
                    $paymentUrl = $other->url;
                    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Using redirect URL for test card: " . $paymentUrl . "\n", FILE_APPEND);
                    break;
                }
            }
        }
    } else {
        // Normal payment method processing
        // Check if we have banklinks in the response
        if (isset($transaction->payment_methods->banklinks) && is_array($transaction->payment_methods->banklinks)) {
            // Look for the selected bank in banklinks
            foreach ($transaction->payment_methods->banklinks as $banklink) {
                if ($banklink->name === $paymentMethod) {
                    $paymentUrl = $banklink->url;
                    break;
                }
            }
        }
        
        // If not found in banklinks, check cards section
        if (!$paymentUrl && isset($transaction->payment_methods->cards) && is_array($transaction->payment_methods->cards)) {
            foreach ($transaction->payment_methods->cards as $card) {
                if ($card->name === $paymentMethod) {
                    $paymentUrl = $card->url;
                    break;
                }
            }
        }
        
        // If still not found, check other payment methods
        if (!$paymentUrl && isset($transaction->payment_methods->other) && is_array($transaction->payment_methods->other)) {
            foreach ($transaction->payment_methods->other as $other) {
                if ($other->name === $paymentMethod) {
                    $paymentUrl = $other->url;
                    break;
                }
            }
        }
        
        // Fallback to redirect URL if available
        if (!$paymentUrl && isset($transaction->payment_methods->other) && is_array($transaction->payment_methods->other)) {
            foreach ($transaction->payment_methods->other as $other) {
                if ($other->name === 'redirect') {
                    $paymentUrl = $other->url;
                    break;
                }
            }
        }
    }
    
    // Log the extracted payment URL
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Extracted payment URL: " . ($paymentUrl ?? 'Not found') . "\n", FILE_APPEND);
    
    // If no payment URL was found, return an error
    if (!$paymentUrl) {
        throw new Exception('Payment URL not found for the selected payment method: ' . $paymentMethod);
    }

    // Return the transaction ID and payment URL
    echo json_encode([
        'transactionId' => $transaction->id,
        'paymentUrl' => $paymentUrl
    ]);
    
} catch (Exception $e) {
    // Log the error
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Error: " . $e->getMessage() . "\n", FILE_APPEND);
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Stack trace: " . $e->getTraceAsString() . "\n", FILE_APPEND);
    // If it's a Maksekeskus exception, try to get more details
    if (method_exists($e, 'getRawContent')) {
        file_put_contents($logFile, date('Y-m-d H:i:s') . " - Raw content: " . $e->getRawContent() . "\n", FILE_APPEND);
    }
    
    // Return error response
    http_response_code(500);
    echo json_encode(['error' => 'Payment processing failed: ' . $e->getMessage()]);
}