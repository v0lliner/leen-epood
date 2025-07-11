<?php
/**
 * Payment processing endpoint
 * 
 * This script handles payment creation requests from the frontend,
 * creates a transaction in Maksekeskus, and returns the payment URL.
 */

// Initialize error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them

// Load utilities
require_once __DIR__ . '/utils/Logger.php';
require_once __DIR__ . '/utils/EnvLoader.php';
require_once __DIR__ . '/utils/SupabaseClient.php';
require_once __DIR__ . '/utils/PaymentProcessor.php';

// Initialize logger
$logger = new Logger('PaymentProcessor', 'payment_processor.log');
$logger->info("Payment processing request received", [
    'time' => date('Y-m-d H:i:s'),
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown'
]);

// Set content type to JSON
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
    $logger->error("Invalid request method", ['method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown']);
    exit();
}

try {
    // Load environment variables
    $envLoader = new EnvLoader($logger);
    if (!$envLoader->load()) {
        throw new Exception("Failed to load environment variables");
    }
    
    // Validate required environment variables
    $requiredVars = [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'MAKSEKESKUS_SHOP_ID',
        'MAKSEKESKUS_PUBLIC_KEY',
        'MAKSEKESKUS_PRIVATE_KEY'
    ];
    
    if (!$envLoader->validateRequired($requiredVars)) {
        throw new Exception("Missing required environment variables");
    }
    
    // Initialize Supabase client
    $supabase = new SupabaseClient(
        $envLoader->getRequired('SUPABASE_URL'),
        $envLoader->getRequired('SUPABASE_SERVICE_ROLE_KEY'),
        $logger
    );
    
    // Initialize payment processor
    $paymentProcessor = new PaymentProcessor(
        $envLoader->getRequired('MAKSEKESKUS_SHOP_ID'),
        $envLoader->getRequired('MAKSEKESKUS_PUBLIC_KEY'),
        $envLoader->getRequired('MAKSEKESKUS_PRIVATE_KEY'),
        $envLoader->get('MAKSEKESKUS_TEST_MODE') === 'true',
        $supabase,
        $logger
    );
    
    // Get the raw POST data
    $rawData = file_get_contents('php://input');
    $logger->info("Received payment request data", ['raw_data_length' => strlen($rawData)]);
    
    // Decode the JSON data
    $data = json_decode($rawData, true);
    
    // Check if JSON is valid
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON data: ' . json_last_error_msg()]);
        $logger->error("Invalid JSON data", ['error' => json_last_error_msg()]);
        exit();
    }
    
    // Validate required fields
    if (!isset($data['amount']) || !isset($data['reference']) || !isset($data['email']) || !isset($data['paymentMethod'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        $logger->error("Missing required fields in payment request");
        exit();
    }
    
    // Define proper country code mapping
    $countryCodeMap = [
        'Estonia' => 'ee',
        'Latvia' => 'lv',
        'Lithuania' => 'lt',
        'Finland' => 'fi'
    ];
    
    // Get the correct country code from the map, default to 'ee' if not found
    $countryCode = $countryCodeMap[$data['country'] ?? 'Estonia'] ?? 'ee';
    
    // Prepare transaction data
    $transactionData = [
        'transaction' => [
            'amount' => (float)$data['amount'],
            'currency' => 'EUR',
            'reference' => $data['reference'],
            'merchant_data' => json_encode([
                'customer_name' => $data['firstName'] . ' ' . $data['lastName'],
                'customer_email' => $data['email'],
                'customer_phone' => $data['phone'] ?? '',
                'shipping_address' => $data['shipping_address'] ?? '',
                'shipping_city' => $data['shipping_city'] ?? '',
                'shipping_postal_code' => $data['shipping_postal_code'] ?? '',
                'shipping_country' => $data['country'] ?? 'Estonia',
                'items' => $data['items'] ?? [],
                'deliveryMethod' => $data['deliveryMethod'] ?? null,
                'omnivaParcelMachineId' => $data['omnivaParcelMachineId'] ?? null,
                'omnivaParcelMachineName' => $data['omnivaParcelMachineName'] ?? null
            ]),
            'return_url' => 'https://leen.ee/checkout/success?reference=' . $data['reference'],
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
    
    // Add IP address if available
    if (isset($_SERVER['REMOTE_ADDR'])) {
        $transactionData['customer']['ip'] = $_SERVER['REMOTE_ADDR'];
    }
    
    $logger->info("Creating transaction", [
        'amount' => $transactionData['transaction']['amount'],
        'reference' => $transactionData['transaction']['reference']
    ]);
    
    // Create transaction
    try {
        $transaction = $paymentProcessor->createMaksekeskusTransaction($transactionData);
        
        // Log the full transaction response for debugging
        $logger->info("Transaction created successfully", [
            'transaction_id' => $transaction->id ?? 'unknown',
            'transaction_data' => json_encode($transaction)
        ]);
    } catch (\Exception $e) {
        $logger->error("Failed to create transaction in Maksekeskus", [
            'error_message' => $e->getMessage(),
            'error_code' => $e->getCode(),
            'transaction_data' => json_encode($transactionData)
        ]);
        throw $e; // Re-throw to maintain original error handling
    }
    
    // Extract payment URL based on the selected payment method
    $paymentUrl = null;
    $paymentMethod = $data['paymentMethod'];
    
    // For test card, we need to handle it differently
    if ($paymentMethod === 'test_card') {
        $logger->info("Processing test_card payment method");
        // For test cards, we should have a direct URL in the transaction response
        if (isset($transaction->payment_url)) {
            $logger->info("Found direct payment_url for test_card", [
                'payment_url' => $transaction->payment_url
            ]);
            $paymentUrl = $transaction->payment_url;
        } else {
            $logger->info("No direct payment_url found for test_card, checking redirect URL");
            // Fallback to redirect URL if available
            foreach ($transaction->payment_methods->other as $other) {
                if ($other->name === 'redirect') {
                    $logger->info("Found redirect URL for test_card", [
                        'redirect_url' => $other->url
                    ]);
                    $paymentUrl = $other->url;
                    break;
                }
            }
        }
    } else {
        $logger->info("Processing regular payment method: " . $paymentMethod);
        // Normal payment method processing
        // Check if we have banklinks in the response
        if (isset($transaction->payment_methods->banklinks) && is_array($transaction->payment_methods->banklinks)) {
            $logger->info("Checking banklinks for payment method", [
                'available_banklinks' => json_encode(array_map(function($b) { return $b->name; }, $transaction->payment_methods->banklinks))
            ]);
            // Look for the selected bank in banklinks
            foreach ($transaction->payment_methods->banklinks as $banklink) {
                if ($banklink->name === $paymentMethod) {
                    $logger->info("Found matching banklink", [
                        'bank' => $banklink->name,
                        'url' => $banklink->url
                    ]);
                    $paymentUrl = $banklink->url;
                    break;
                }
            }
        }
        
        // If not found in banklinks, check cards section
        if (!$paymentUrl && isset($transaction->payment_methods->cards) && is_array($transaction->payment_methods->cards)) {
            $logger->info("Checking cards for payment method", [
                'available_cards' => json_encode(array_map(function($c) { return $c->name; }, $transaction->payment_methods->cards))
            ]);
            foreach ($transaction->payment_methods->cards as $card) {
                if ($card->name === $paymentMethod) {
                    $logger->info("Found matching card", [
                        'card' => $card->name,
                        'url' => $card->url
                    ]);
                    $paymentUrl = $card->url;
                    break;
                }
            }
        }
        
        // If still not found, check other payment methods
        if (!$paymentUrl && isset($transaction->payment_methods->other) && is_array($transaction->payment_methods->other)) {
            $logger->info("Checking other payment methods", [
                'available_methods' => json_encode(array_map(function($o) { return $o->name; }, $transaction->payment_methods->other))
            ]);
            foreach ($transaction->payment_methods->other as $other) {
                if ($other->name === $paymentMethod) {
                    $logger->info("Found matching other payment method", [
                        'method' => $other->name,
                        'url' => $other->url
                    ]);
                    $paymentUrl = $other->url;
                    break;
                }
            }
        }
        
        // Fallback to redirect URL if available
        if (!$paymentUrl && isset($transaction->payment_methods->other) && is_array($transaction->payment_methods->other)) {
            $logger->info("No specific payment method found, looking for redirect URL");
            foreach ($transaction->payment_methods->other as $other) {
                if ($other->name === 'redirect') {
                    $logger->info("Found redirect URL as fallback", [
                        'url' => $other->url
                    ]);
                    $paymentUrl = $other->url;
                    break;
                }
            }
        }
    }
    
    // If no payment URL was found, return an error
    if (!$paymentUrl) {
        $logger->error("No payment URL found for the selected payment method", [
            'payment_method' => $paymentMethod,
            'transaction_id' => $transaction->id ?? 'unknown',
            'available_methods' => json_encode($transaction)
        ]);
        throw new Exception('Payment URL not found for the selected payment method: ' . $paymentMethod);
    }
    
    $logger->info("Payment URL extracted", [
        'payment_method' => $paymentMethod,
        'payment_url' => $paymentUrl
    ]);
    
    // Return the transaction ID and payment URL
    echo json_encode([
        'transactionId' => $transaction->id,
        'paymentUrl' => $paymentUrl
    ]);
    
} catch (Exception $e) {
    // Log the error
    $logger->exception($e, "Payment processing failed");
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'error' => 'Payment processing failed: ' . $e->getMessage()
    ]);
}

// Final log entry to confirm script completion
$logger->info("Payment processing completed");