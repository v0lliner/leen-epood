<?php
// This file contains the processOrder function used by teavitus.php

/**
 * Process order data from Maksekeskus transaction
 * 
 * @param object $transactionData Transaction data from Maksekeskus
 * @param array $paymentData Payment notification data
 * @return bool Success status
 */
function processOrder($transactionData, $paymentData) {
    // Set up logging
    $logDir = __DIR__ . '/../../logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    $logFile = $logDir . '/order_processing.log';
    
    // Function to log messages
    function orderLog($message, $data = null) {
        global $logFile;
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "$timestamp - $message";
        
        if ($data !== null) {
            $logEntry .= ": " . (is_string($data) ? $data : json_encode($data));
        }
        
        file_put_contents($logFile, $logEntry . "\n", FILE_APPEND);
    }
    
    try {
        orderLog("Alustame tellimuse töötlemist", [
            'transactionData' => isset($transactionData) ? 'present' : 'missing', 
            'paymentData' => isset($paymentData) ? 'present' : 'missing'
        ]);
        
        // Extract merchant data
        $merchantData = json_decode($transactionData->transaction->merchant_data ?? '{}', true);
        orderLog("Ekstraktitud merchant data", $merchantData);
        orderLog("Tehingu viide", $transactionData->transaction->reference ?? 'no reference');
        
        // Extract customer info
        $customerName = $merchantData['customer_name'] ?? '';
        $customerEmail = $merchantData['customer_email'] ?? '';
        $customerPhone = $merchantData['customer_phone'] ?? '';
        
        // Extract order items
        $items = $merchantData['items'] ?? [];
        
        // Generate order number if not exists
        $orderNumber = generateOrderNumber();
        orderLog("Genereeritud tellimuse number", $orderNumber);
        
        // Check if order already exists with this reference
        $orderReference = $transactionData->transaction->reference ?? '';
        orderLog("Kontrollime olemasolevat tellimust viitega", $orderReference);

        // Define supabaseRequest function
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
                orderLog("cURL Error", $error);
                return ['error' => $error, 'status' => $statusCode];
            }
            
            return [
                'data' => json_decode($response, true),
                'status' => $statusCode
            ];
        }

        $existingOrderQuery = supabaseRequest(
            "/rest/v1/orders?reference=eq.$orderReference",
            'GET'
        );
        
        $orderExists = false;
        $orderId = null;
        
        if ($existingOrderQuery['status'] === 200 && !empty($existingOrderQuery['data'])) {
            $orderExists = true;
            $orderId = $existingOrderQuery['data'][0]['id'] ?? null;
            $orderNumber = $existingOrderQuery['data'][0]['order_number'] ?? $orderNumber;
            orderLog("Leitud olemasolev tellimus", ['id' => $orderId, 'order_number' => $orderNumber]);
        }
        
        // Determine order status based on payment status
        $orderStatus = 'PENDING';
        if ($paymentData['status'] === 'COMPLETED') {
            $orderStatus = 'PAID';
        } else if ($paymentData['status'] === 'CANCELLED') {
            $orderStatus = 'CANCELLED';
        }
        
        // Prepare order data
        $orderData = [
            'customer_name' => $customerName,
            'customer_email' => $customerEmail,
            'customer_phone' => $customerPhone,
            'shipping_address' => $merchantData['shipping_address'] ?? '',
            'shipping_city' => $merchantData['shipping_city'] ?? '',
            'shipping_postal_code' => $merchantData['shipping_postal_code'] ?? '',
            'shipping_country' => $merchantData['shipping_country'] ?? 'Estonia',
            'total_amount' => $transactionData->transaction->amount,
            'currency' => $transactionData->transaction->currency,
            'status' => $orderStatus,
            'notes' => $merchantData['notes'] ?? '',
            'order_number' => $orderNumber,
            'omniva_parcel_machine_id' => $merchantData['omnivaParcelMachineId'] ?? null,
            'omniva_parcel_machine_name' => $merchantData['omnivaParcelMachineName'] ?? null,
            'reference' => $orderReference // Store the reference for future lookups
        ];
        
        // If order exists, update it
        if ($orderExists && $orderId) {
            orderLog("Uuendame olemasolevat tellimust", ['id' => $orderId, 'status' => $orderStatus]);
            
            $updateResult = supabaseRequest(
                "/rest/v1/orders?id=eq.$orderId",
                'PATCH',
                $orderData
            );
            
            if ($updateResult['status'] !== 204) {
                orderLog("Viga tellimuse uuendamisel", $updateResult);
                return false;
            }
        } 
        // Otherwise create a new order
        else {
            orderLog("Loome uue tellimuse", $orderData);
            
            $createResult = supabaseRequest(
                "/rest/v1/orders",
                'POST',
                $orderData
            );
            
            if ($createResult['status'] !== 201) {
                orderLog("Viga tellimuse loomisel", $createResult);
                return false;
            }
            
            // Get the new order ID
            orderLog("Küsime uue tellimuse ID", $orderNumber);
            $getOrderResult = supabaseRequest(
                "/rest/v1/orders?order_number=eq.$orderNumber",
                'GET'
            );
            
            if ($getOrderResult['status'] !== 200 || empty($getOrderResult['data'])) {
                orderLog("Viga loodud tellimuse küsimisel", $getOrderResult);
                return false;
            }
            
            $orderId = $getOrderResult['data'][0]['id'] ?? null;
            
            if (!$orderId) {
                orderLog("Ei saanud uue tellimuse ID-d");
                return false;
            }
            
            orderLog("Uus tellimus loodud", ['id' => $orderId, 'order_number' => $orderNumber]);
        }
        
        // Process order items
        if (!empty($items) && $orderId) {
            // First, delete any existing items for this order to avoid duplicates
            orderLog("Kustutame olemasolevad tellimuse tooted", $orderId);
            $deleteItemsResult = supabaseRequest(
                "/rest/v1/order_items?order_id=eq.$orderId",
                'DELETE'
            );
            
            orderLog("Kustutatud olemasolevad tellimuse tooted", $deleteItemsResult);
            
            // Then insert new items
            foreach ($items as $item) {
                $itemData = [
                    'order_id' => $orderId,
                    'product_id' => $item['id'],
                    'product_title' => $item['title'],
                    'quantity' => $item['quantity'] ?? 1,
                    'price' => $item['price']
                ];
                
                orderLog("Loome tellimuse toote", $itemData);
                $createItemResult = supabaseRequest(
                    "/rest/v1/order_items",
                    'POST',
                    $itemData
                );
                
                if ($createItemResult['status'] !== 201) {
                    orderLog("Viga tellimuse toote loomisel", ['item' => $itemData, 'result' => $createItemResult]);
                }
                
                // Update product availability if needed
                if ($orderStatus === 'PAID' || $orderStatus === 'PROCESSING') {
                    $productId = $item['id'];
                    
                    // Mark product as unavailable (sold) - every product is unique
                    orderLog("Uuendame toote saadavust", ['product_id' => $productId]);
                    $updateProductResult = supabaseRequest(
                        "/rest/v1/products?id=eq.$productId",
                        'PATCH',
                        ['available' => false]
                    );
                    
                    orderLog("Uuendatud toote saadavus", [
                        'product_id' => $productId, 
                        'available' => false,
                        'result' => $updateProductResult
                    ]);
                }
            }
        }
        
        // Record payment
        if ($orderId) {
            $paymentData = [
                'order_id' => $orderId,
                'transaction_id' => $paymentData['transaction'] ?? $transactionId,
                'payment_method' => $paymentData['method'] ?? 'unknown',
                'amount' => $paymentData['amount'],
                'currency' => $paymentData['currency'],
                'status' => $paymentData['status']
            ];
            
            orderLog("Loome makse kirje", $paymentData);
            $createPaymentResult = supabaseRequest(
                "/rest/v1/order_payments",
                'POST',
                $paymentData
            );
            
            if ($createPaymentResult['status'] !== 201) {
                orderLog("Viga makse kirje loomisel", ['payment' => $paymentData, 'result' => $createPaymentResult]);
            } else {
                orderLog("Makse kirje loodud", $paymentData);
            }
        }
        
        // Send confirmation email if payment is completed
        if ($paymentData['status'] === 'COMPLETED' && !empty($customerEmail)) {
            orderLog("Saadame kinnituskirja kliendile", $customerEmail);
            
            // Send email using PHPMailer
            require_once __DIR__ . '/send-order-confirmation.php';
            sendOrderConfirmation($orderId, $orderNumber, $customerEmail, $customerName, $items);
            
            // If this is an Omniva parcel machine order, register the shipment
            if (isset($merchantData['deliveryMethod']) && $merchantData['deliveryMethod'] === 'omniva' && 
                !empty($merchantData['omnivaParcelMachineId'])) {
                
                orderLog("Alustame Omniva saadetise registreerimist", $orderId);
                
                // Make a request to the Omniva shipment registration script
                $omnivaData = [
                    'orderId' => $orderId,
                    'sendNotification' => true
                ];
                
                $ch = curl_init($_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/php/register-omniva-shipment.php');
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($omnivaData));
                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                curl_setopt($ch, CURLOPT_TIMEOUT, 30);
                
                orderLog("Omniva saadetise registreerimise päring saadetud", $omnivaData);
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $error = curl_error($ch);
                
                curl_close($ch);
                
                orderLog("Omniva saadetise registreerimise vastus", ['httpCode' => $httpCode, 'response' => $response, 'error' => $error]);
                
                if ($error) {
                    orderLog("Viga Omniva saadetise registreerimisel", $error);
                } else {
                    $responseData = json_decode($response, true);
                    orderLog("Omniva saadetise registreerimise vastus", $responseData);
                    
                    if ($httpCode >= 200 && $httpCode < 300 && isset($responseData['success']) && $responseData['success']) {
                        orderLog("Omniva saadetis edukalt registreeritud", [
                            'barcode' => $responseData['barcode'] ?? 'not provided'
                        ]);
                    } else {
                        orderLog("Omniva saadetise registreerimine ebaõnnestus", $responseData);
                    }
                }
            } else {
                orderLog("Pole Omniva pakiautomaadi tellimus või puuduvad andmed", [
                    'deliveryMethod' => $merchantData['deliveryMethod'] ?? 'not set',
                    'omnivaParcelMachineId' => $merchantData['omnivaParcelMachineId'] ?? 'not set'
                ]);
            }
        }
        
        return true;
    } catch (Exception $e) {
        orderLog("Viga tellimuse töötlemisel", $e->getMessage());
        return false;
    }
}

// Function to generate a unique order number
function generateOrderNumber() {
    return 'ORD-' . date('Ymd') . '-' . substr(uniqid(), -6);
}