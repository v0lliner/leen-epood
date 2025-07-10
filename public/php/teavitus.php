<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them

// Set up logging
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0777, true);
}
$logFile = $logDir . '/maksekeskus_teavitus.log';

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

// Function to connect to Supabase via REST API
function supabaseRequest($endpoint, $method = 'GET', $data = null) {
    $supabaseUrl = 'https://epcenpirjkfkgdgxktrm.supabase.co';
    $supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY2VucGlyamtma2dkZ3hrdHJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExMzgwNCwiZXhwIjoyMDY2Njg5ODA0fQ.wbsLJEL_U-EHNkDe4CFt6-dPNpWHe50WKCQqsoyYdLs';
    
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

// Log all incoming data for debugging
logMessage("Teavitus saabunud", [
    'POST' => $_POST,
    'GET' => $_GET,
    'RAW' => file_get_contents('php://input')
]);

// Require the Maksekeskus SDK
require __DIR__ . '/maksekeskus/vendor/autoload.php';
use Maksekeskus\Maksekeskus;

// Initialize Maksekeskus client with your credentials
$shopId = '4e2bed9a-aa24-4b87-801b-56c31c535d36';
$publicKey = 'wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM';
$privateKey = 'WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ';
$testMode = false; // Set to false for production

try {
    $MK = new Maksekeskus($shopId, $publicKey, $privateKey, $testMode);
    
    // Verify the notification
    $request = $_REQUEST;
    logMessage("Kontrollime MAC signatuuri", $request);
    
    $isValid = $MK->verifyMac($request);
    
    if (!$isValid) {
        logMessage("Vigane MAC signatuur", $request);
        http_response_code(400);
        echo json_encode(['error' => 'Invalid signature']);
        exit();
    }
    
    logMessage("MAC signatuur edukalt kontrollitud");
    
    // Extract the notification data
    $data = $MK->extractRequestData($request);
    logMessage("Andmed edukalt ekstraktitud", $data);
    
    // Get the transaction ID
    $transactionId = isset($data['transaction']) ? $data['transaction'] : null;
    $reference = isset($data['reference']) ? $data['reference'] : null;
    $status = isset($data['status']) ? $data['status'] : null;
    
    logMessage("Tehingu andmed", [
        'transactionId' => $transactionId,
        'reference' => $reference,
        'status' => $status
    ]);

    if (!$transactionId) {
        logMessage("Tehingu ID puudub teavituses", $data);
        http_response_code(400);
        echo json_encode(['error' => 'Missing transaction ID']);
        exit();
    }
    
    // Fetch the full transaction details from Maksekeskus
    try {
        $transaction = $MK->getTransaction($transactionId);
        logMessage("Tehingu detailid edukalt laaditud", $transaction);
        
        // Get the transaction status from the transaction object
        // This is more reliable than the status from the notification
        $transactionStatus = $transaction->transaction->status ?? $status;
        
        // Process the order in database
        if ($transactionStatus === 'COMPLETED') {
            logMessage("Makse on COMPLETED staatuses, töötleme tellimust");
            
            // Extract merchant data - this is a JSON string that needs to be decoded
            $merchantDataString = $transaction->transaction->merchant_data ?? '{}';
            $merchantData = json_decode($merchantDataString, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                logMessage("Viga merchant_data parsimisel", json_last_error_msg());
                $merchantData = [];
            }
            
            logMessage("Kaupmeheandmed", $merchantData);
            
            // Check if order already exists and is processed
            $orderResult = supabaseRequest(
                "/rest/v1/orders?reference=eq.$reference&select=id,status",
                'GET'
            );
            
            if ($orderResult['status'] === 200 && !empty($orderResult['data'])) {
                $order = $orderResult['data'][0];
                
                // If order is already paid, don't process again
                if ($order['status'] === 'PAID' || $order['status'] === 'PROCESSING' || 
                    $order['status'] === 'SHIPPED' || $order['status'] === 'COMPLETED') {
                    logMessage("Tellimus on juba töödeldud", [
                        'order_id' => $order['id'],
                        'status' => $order['status']
                    ]);
                    
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'Order already processed',
                        'order_id' => $order['id']
                    ]);
                    exit();
                }
                
                // Update existing order
                $orderId = $order['id'];
                
                // Update order status to PAID
                $updateResult = supabaseRequest(
                    "/rest/v1/orders?id=eq.$orderId",
                    'PATCH',
                    [
                        'status' => 'PAID',
                        'updated_at' => date('c') // ISO 8601 format
                    ]
                );
                
                if ($updateResult['status'] !== 204) {
                    logMessage("Viga tellimuse uuendamisel", $updateResult);
                    throw new Exception("Failed to update order status");
                }
                
                logMessage("Tellimuse staatus uuendatud", [
                    'order_id' => $orderId,
                    'status' => 'PAID'
                ]);
            } else {
                // Create new order if it doesn't exist
                // This should rarely happen as orders are typically created before payment
                logMessage("Tellimust ei leitud, loome uue", $reference);
                
                // Extract customer data from merchant_data
                $customerName = $merchantData['customer_name'] ?? '';
                $customerEmail = $merchantData['customer_email'] ?? '';
                $customerPhone = $merchantData['customer_phone'] ?? '';
                
                // Extract delivery method and address
                $deliveryMethod = $merchantData['deliveryMethod'] ?? '';
                $omnivaParcelMachineId = $merchantData['omnivaParcelMachineId'] ?? null;
                $omnivaParcelMachineName = $merchantData['omnivaParcelMachineName'] ?? null;
                
                // Create order in database
                $orderData = [
                    'order_number' => $reference,
                    'reference' => $reference,
                    'customer_name' => $customerName,
                    'customer_email' => $customerEmail,
                    'customer_phone' => $customerPhone,
                    'total_amount' => floatval($transaction->transaction->amount ?? 0),
                    'currency' => $transaction->transaction->currency ?? 'EUR',
                    'status' => 'PAID',
                    'omniva_parcel_machine_id' => $omnivaParcelMachineId,
                    'omniva_parcel_machine_name' => $omnivaParcelMachineName,
                    'created_at' => date('c'),
                    'updated_at' => date('c')
                ];
                
                $createResult = supabaseRequest(
                    "/rest/v1/orders",
                    'POST',
                    $orderData
                );
                
                if ($createResult['status'] !== 201) {
                    logMessage("Viga tellimuse loomisel", $createResult);
                    throw new Exception("Failed to create order");
                }
                
                $orderId = $createResult['data'][0]['id'] ?? null;
                
                if (!$orderId) {
                    logMessage("Tellimuse ID puudub vastuses", $createResult);
                    throw new Exception("Order ID missing in response");
                }
                
                logMessage("Uus tellimus loodud", [
                    'order_id' => $orderId,
                    'reference' => $reference
                ]);
                
                // Create order items
                if (isset($merchantData['items']) && is_array($merchantData['items'])) {
                    foreach ($merchantData['items'] as $item) {
                        $itemData = [
                            'order_id' => $orderId,
                            'product_id' => $item['id'] ?? null,
                            'product_title' => $item['title'] ?? '',
                            'quantity' => $item['quantity'] ?? 1,
                            'price' => floatval($item['price'] ?? 0),
                            'created_at' => date('c')
                        ];
                        
                        $itemResult = supabaseRequest(
                            "/rest/v1/order_items",
                            'POST',
                            $itemData
                        );
                        
                        if ($itemResult['status'] !== 201) {
                            logMessage("Viga tellimuse eseme loomisel", $itemResult);
                            // Continue with other items even if one fails
                        }
                    }
                    
                    logMessage("Tellimuse esemed loodud", [
                        'order_id' => $orderId,
                        'items_count' => count($merchantData['items'])
                    ]);
                }
            }
            
            // Record payment information
            $paymentData = [
                'order_id' => $orderId,
                'transaction_id' => $transactionId,
                'payment_method' => $transaction->transaction->method ?? '',
                'amount' => floatval($transaction->transaction->amount ?? 0),
                'currency' => $transaction->transaction->currency ?? 'EUR',
                'status' => $transactionStatus,
                'created_at' => date('c'),
                'updated_at' => date('c')
            ];
            
            $paymentResult = supabaseRequest(
                "/rest/v1/order_payments",
                'POST',
                $paymentData
            );
            
            if ($paymentResult['status'] !== 201) {
                logMessage("Viga makse info salvestamisel", $paymentResult);
                // Continue even if payment record fails
            } else {
                logMessage("Makse info salvestatud", [
                    'order_id' => $orderId,
                    'transaction_id' => $transactionId
                ]);
            }
            
            // Register Omniva shipment if needed
            if ($deliveryMethod === 'omniva' && $omnivaParcelMachineId) {
                // Call the Omniva shipment registration endpoint
                $shipmentData = [
                    'orderId' => $orderId,
                    'sendNotification' => true
                ];
                
                $shipmentResult = file_get_contents(
                    'http://' . $_SERVER['HTTP_HOST'] . '/php/register-omniva-shipment.php',
                    false,
                    stream_context_create([
                        'http' => [
                            'method' => 'POST',
                            'header' => 'Content-Type: application/json',
                            'content' => json_encode($shipmentData)
                        ]
                    ])
                );
                
                if ($shipmentResult === false) {
                    logMessage("Viga Omniva saadetise registreerimisel", "HTTP request failed");
                } else {
                    $shipmentResponse = json_decode($shipmentResult, true);
                    logMessage("Omniva saadetis registreeritud", $shipmentResponse);
                }
            }
            
            // Return success response
            echo json_encode([
                'status' => 'success',
                'message' => 'Payment notification processed successfully',
                'order_id' => $orderId
            ]);
        } else {
            logMessage("Makse ei ole COMPLETED staatuses", [
                'status' => $transactionStatus,
                'reference' => $reference
            ]);
            
            // Return success response but note the status
            echo json_encode([
                'status' => 'success',
                'message' => 'Payment notification received but status is not COMPLETED',
                'payment_status' => $transactionStatus
            ]);
        }
    } catch (\Exception $e) {
        logMessage("Viga tehingu detailide laadimisel", $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch transaction details']);
        exit();
    }
} catch (\Exception $e) {
    logMessage("Üldine viga", $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}