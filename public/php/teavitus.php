<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them

// Load environment variables
require_once __DIR__ . '/env-loader.php';

// Set up logging
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0777, true);
}
$logFile = $logDir . '/payment_notification.log';

// Function to log messages
function logMessage($message, $data = null) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "$timestamp - $message";
    
    if ($data !== null) {
        $logEntry .= ": " . (is_string($data) ? $data : json_encode($data));
    }
    
    $result = file_put_contents($logFile, $logEntry . "\n", FILE_APPEND);
    if ($result === false) {
        error_log("Failed to write to log file: $logFile");
    }
}

// Log all incoming data for debugging
logMessage("Payment notification received", [
    'POST' => $_POST,
    'GET' => $_GET,
    'RAW' => file_get_contents('php://input')
]);

// Require the Maksekeskus SDK
require __DIR__ . '/maksekeskus/vendor/autoload.php';
use Maksekeskus\Maksekeskus;

// Function to connect to Supabase via REST API
function supabaseRequest($endpoint, $method = 'GET', $data = null) {
    $supabaseUrl = 'https://epcenpirjkfkgdgxktrm.supabase.co';
    $supabaseKey = getenv('SUPABASE_SERVICE_ROLE_KEY');
    
    $url = $supabaseUrl . $endpoint;
    
    $ch = curl_init($url);
    
    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $supabaseKey,
        'apikey: ' . $supabaseKey
    ];
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    } else if ($method === 'PATCH' || $method === 'PUT') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    } else if ($method === 'DELETE') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    }
    
    $response = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    if ($error) {
        logMessage("cURL Error", $error);
        return ['error' => $error, 'status' => $statusCode];
    }
    
    return [
        'data' => json_decode($response, true),
        'status' => $statusCode
    ];
}

// Check if we have the required environment variables
if (!getenv('MAKSEKESKUS_SHOP_ID') || !getenv('MAKSEKESKUS_PUBLIC_KEY') || !getenv('MAKSEKESKUS_PRIVATE_KEY')) {
    // Try to load from .env file if it exists
    if (file_exists(__DIR__ . '/../../../.env')) {
        $envFile = file_get_contents(__DIR__ . '/../../../.env');
        
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
    
    // If still not set, try alternate location
    if ((!getenv('MAKSEKESKUS_SHOP_ID') || !getenv('MAKSEKESKUS_PUBLIC_KEY') || !getenv('MAKSEKESKUS_PRIVATE_KEY')) && 
        file_exists(__DIR__ . '/../../.env')) {
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
        
        logMessage("Loaded Maksekeskus credentials from alternate location");
    }
}

// Check if we have the required Supabase environment variables
if (!getenv('SUPABASE_SERVICE_ROLE_KEY')) {
    // Try to load from .env file if it exists
    if (file_exists(__DIR__ . '/../../../.env')) {
        $envFile = file_get_contents(__DIR__ . '/../../../.env');
        
        preg_match('/SUPABASE_SERVICE_ROLE_KEY=([^\n]+)/', $envFile, $matches);
        if (isset($matches[1])) {
            putenv('SUPABASE_SERVICE_ROLE_KEY=' . $matches[1]);
        }
    }
    
    // If still not set, try alternate location
    if (!getenv('SUPABASE_SERVICE_ROLE_KEY') && file_exists(__DIR__ . '/../../.env')) {
        $envFile = file_get_contents(__DIR__ . '/../../.env');
        
        preg_match('/SUPABASE_SERVICE_ROLE_KEY=([^\n]+)/', $envFile, $matches);
        if (isset($matches[1])) {
            putenv('SUPABASE_SERVICE_ROLE_KEY=' . $matches[1]);
            logMessage("Loaded SUPABASE_SERVICE_ROLE_KEY from alternate location");
        }
    }
}

// Main execution starts here
try {
    // Initialize Maksekeskus client with your credentials
    $shopId = getenv('MAKSEKESKUS_SHOP_ID') ?: '4e2bed9a-aa24-4b87-801b-56c31c535d36';
    $publicKey = getenv('MAKSEKESKUS_PUBLIC_KEY') ?: 'wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM';
    $privateKey = getenv('MAKSEKESKUS_PRIVATE_KEY') ?: 'WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ';
    $testMode = getenv('MAKSEKESKUS_TEST_MODE') === 'true'; // Default to false for production

    $MK = new Maksekeskus($shopId, $publicKey, $privateKey, $testMode);
    
    // Verify the notification
    $request = $_REQUEST;
    logMessage("Verifying MAC signature", $request);
    
    $isValid = $MK->verifyMac($request);
    
    if (!$isValid) {
        logMessage("Invalid MAC signature", $request);
        http_response_code(400);
        echo json_encode(['error' => 'Invalid signature']);
        exit();
    }
    
    logMessage("MAC signature verified successfully");
    
    // Extract the notification data
    $data = $MK->extractRequestData($request, false);
    logMessage("Extracted data", $data);
    
    // Get the transaction ID and reference
    $transactionId = isset($data['transaction']) ? $data['transaction'] : null;
    $reference = isset($data['reference']) ? $data['reference'] : null;
    $status = isset($data['status']) ? $data['status'] : null;

    if (!$transactionId && $reference) {
        logMessage("Warning: No transaction ID in notification, using reference instead", $data);
        $transactionId = $reference;
    }

    if (!$transactionId) {
        logMessage("No transaction ID in notification", $data);
        http_response_code(400);
        echo json_encode(['error' => 'Missing transaction ID']);
        exit();
    }
    
    logMessage("Transaction ID", $transactionId);
    logMessage("Reference", $reference);
    logMessage("Status", $status);
    
    // Extract merchant data
    try {
        $merchantData = json_decode($data['merchant_data'] ?? '{}', true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            logMessage("Error decoding merchant data: " . json_last_error_msg());
            $merchantData = [];
        }
    } catch (Exception $e) {
        logMessage("Exception decoding merchant data: " . $e->getMessage());
        $merchantData = [];
    }
    logMessage("Merchant data", $merchantData);
    
    // Process the order if status is COMPLETED
    if ($status === 'COMPLETED' || $status === 'APPROVED') {
        logMessage("Payment is COMPLETED, processing order");
        
        // Check if order already exists by reference
        $existingOrderResult = supabaseRequest(
            "/rest/v1/orders?reference=eq.$reference",
            'GET'
        );
        
        if ($existingOrderResult['status'] === 200 && !empty($existingOrderResult['data'])) {
            logMessage("Order already exists with reference", $reference);
            
            // Update existing order status to PAID
            $orderId = $existingOrderResult['data'][0]['id'];
            $updateResult = supabaseRequest(
                "/rest/v1/orders?id=eq.$orderId",
                'PATCH',
                ['status' => 'PAID', 'reference' => $reference]
            );
            
            if ($updateResult['status'] !== 204) {
                logMessage("Failed to update order status", $updateResult);
            } else {
                logMessage("Order status updated to PAID", $orderId);
            }
        } else {
            // Create new order
            logMessage("Creating new order from payment data");
            
            if ($merchantData) {
                // Extract customer data from merchant_data
                $customerName = $merchantData['customer_name'] ?? '';
                $customerEmail = $merchantData['customer_email'] ?? '';
                $customerPhone = $merchantData['customer_phone'] ?? '';
                $shippingAddress = $merchantData['shipping_address'] ?? '';
                $shippingCity = $merchantData['shipping_city'] ?? '';
                $shippingPostalCode = $merchantData['shipping_postal_code'] ?? '';
                $shippingCountry = $merchantData['shipping_country'] ?? '';
                $items = $merchantData['items'] ?? [];
                $deliveryMethod = $merchantData['deliveryMethod'] ?? null;
                $omnivaParcelMachineId = $merchantData['omnivaParcelMachineId'] ?? null;
                $omnivaParcelMachineName = $merchantData['omnivaParcelMachineName'] ?? null;
            
                // Create order in Supabase
                $orderData = [
                    'customer_name' => $customerName,
                    'customer_email' => (string)$customerEmail,
                    'customer_phone' => (string)$customerPhone,
                    'shipping_address' => $shippingAddress,
                    'shipping_city' => $shippingCity,
                    'shipping_postal_code' => $shippingPostalCode,
                    'shipping_country' => $shippingCountry,
                    'total_amount' => (float)$data['amount'],
                    'currency' => $data['currency'],
                    'status' => 'PAID',
                    'reference' => (string)$reference,
                    'omniva_parcel_machine_id' => $omnivaParcelMachineId ? (string)$omnivaParcelMachineId : null,
                    'omniva_parcel_machine_name' => $omnivaParcelMachineName
                ];
            
                logMessage("Creating order with data", $orderData);
            
                $orderResult = supabaseRequest(
                    "/rest/v1/orders",
                    'POST',
                    $orderData
                );
            
                if ($orderResult['status'] !== 201 && $orderResult['status'] !== 200) {
                    logMessage("Failed to create order", $orderResult);
                } else {
                    logMessage("Order created successfully");
                    
                    // Extract the order ID from the response
                    $orderId = null;
                    if (isset($orderResult['data'][0]['id'])) {
                        $orderId = $orderResult['data'][0]['id'];
                        logMessage("Order ID extracted from response", $orderId);
                    }
                    
                    // If order ID is not in the response, fetch it using the reference
                    if (!$orderId && $reference) {
                        logMessage("Order ID not found in response, fetching by reference", $reference);
                        $fetchOrderResult = supabaseRequest(
                            "/rest/v1/orders?reference=eq.$reference",
                            'GET'
                        );
                        
                        if ($fetchOrderResult['status'] === 200 && !empty($fetchOrderResult['data'])) {
                            $orderId = $fetchOrderResult['data'][0]['id'];
                            logMessage("Successfully fetched order ID by reference", $orderId);
                        } else {
                            logMessage("Failed to fetch order ID by reference", $fetchOrderResult);
                        }
                    }
                    
                    if (!$orderId) {
                        logMessage("Critical: Could not determine order ID after creation", $orderResult);
                    } else {
                        // Add order items
                        if (!empty($items)) {
                            foreach ($items as $item) {
                                $orderItemData = [
                                    'order_id' => $orderId,
                                    'product_id' => $item['id'],
                                    'product_title' => $item['title'],
                                    'quantity' => $item['quantity'] ?? 1,
                                    'price' => $item['price']
                                ];
                                
                                $orderItemResult = supabaseRequest(
                                    "/rest/v1/order_items",
                                    'POST',
                                    $orderItemData
                                );
                                
                                if ($orderItemResult['status'] !== 201 && $orderItemResult['status'] !== 200) {
                                    logMessage("Failed to create order item", $orderItemResult);
                                } else {
                                    logMessage("Order item created successfully", $orderItemResult['data'][0]['id']);
                                }
                            }
                        }
                        
                        // Create payment record
                        $paymentData = [
                            'order_id' => $orderId,
                            'transaction_id' => $transactionId,
                            'payment_method' => isset($data['method']) ? $data['method'] : 'unknown',
                            'amount' => $data['amount'],
                            'currency' => $data['currency'],
                            'status' => $status
                        ];
                        
                        $paymentResult = supabaseRequest(
                            "/rest/v1/order_payments",
                            'POST',
                            $paymentData
                        );
                        
                        if ($paymentResult['status'] !== 201 && $paymentResult['status'] !== 200) {
                            logMessage("Failed to create payment record", $paymentResult);
                        } else {
                            logMessage("Payment record created successfully", $paymentResult['data'][0]['id']);
                        }
                    }
                }
            } else {
                logMessage("Error: No merchant data available to create order");
                
                // If Omniva delivery method, register shipment
                if ($deliveryMethod === 'omniva-parcel-machine' && $omnivaParcelMachineId) {
                    logMessage("Omniva delivery method detected, will register shipment later");
                    // Shipment registration is handled by a separate process
                }
            }
        }
    } else {
        logMessage("Payment status is not COMPLETED, no order processing needed");
        
        // Update payment status if order exists
        if ($reference) {
            $existingOrderResult = supabaseRequest(
                "/rest/v1/orders?reference=eq.$reference",
                'GET'
            );
            
            if ($existingOrderResult['status'] === 200 && !empty($existingOrderResult['data'])) {
                $orderId = $existingOrderResult['data'][0]['id'];
                
                // Create or update payment record
                $existingPaymentResult = supabaseRequest(
                    "/rest/v1/order_payments?order_id=eq.$orderId&transaction_id=eq.$transactionId",
                    'GET'
                );
                
                $paymentData = [
                    'order_id' => $orderId,
                    'transaction_id' => $transactionId,
                    'payment_method' => $data['method'] ?? 'unknown',
                    'amount' => $data['amount'],
                    'currency' => $data['currency'],
                    'status' => $status
                ];
                
                if ($existingPaymentResult['status'] === 200 && !empty($existingPaymentResult['data'])) {
                    // Update existing payment
                    $paymentId = $existingPaymentResult['data'][0]['id'];
                    $paymentResult = supabaseRequest(
                        "/rest/v1/order_payments?id=eq.$paymentId",
                        'PATCH',
                        $paymentData
                    );
                } else {
                    // Create new payment record
                    $paymentResult = supabaseRequest(
                        "/rest/v1/order_payments",
                        'POST',
                        $paymentData
                    );
                }
                
                if ($paymentResult['status'] !== 201 && $paymentResult['status'] !== 200 && $paymentResult['status'] !== 204) {
                    logMessage("Failed to create/update payment record", $paymentResult);
                } else {
                    logMessage("Payment record created/updated successfully");
                }
            }
        }
    }
    
    // Return success response
    echo json_encode([
        'status' => 'success',
        'message' => 'Payment notification received and processed successfully',
        'transactionId' => $transactionId,
        'reference' => $reference
    ]);
    
} catch (\Exception $e) {
    logMessage("Exception", $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}