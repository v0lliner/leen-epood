<?php
// Enable detailed error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set up logging
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}
$logFile = $logDir . '/payment_notification_log.txt';

// Require the Maksekeskus SDK
require __DIR__ . '/maksekeskus/vendor/autoload.php';
require __DIR__ . '/phpmailer/PHPMailer.php';
require __DIR__ . '/phpmailer/SMTP.php';
require __DIR__ . '/phpmailer/Exception.php';
// Require PHPMailer
require_once __DIR__ . '/../vendor/phpmailer/phpmailer/src/Exception.php';
require_once __DIR__ . '/../vendor/phpmailer/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/../vendor/phpmailer/phpmailer/src/SMTP.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;


use Maksekeskus\Maksekeskus;
use Maksekeskus\MKException;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Set content type to JSON for API responses
header('Content-Type: application/json');

// Log file for debugging
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
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
    
    file_put_contents($logFile, $logEntry . "\n", FILE_APPEND);
}

// Function to connect to Supabase via REST API
function supabaseRequest($endpoint, $method = 'GET', $data = null) {
    $supabaseUrl = 'https://epcenpirjkfkgdgxktrm.supabase.co';
    $supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY2VucGlyamtma2dkZ3hrdHJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExMzgwNCwiZXhwIjoyMDY2Njg5ODA0fQ.VQgOh4VmI0hmyXawVt0-uOmMFgHXkqhkMFQxBLjjQME';
    
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

// Function to generate a unique order number
function generateOrderNumber() {
    return 'ORD-' . date('Ymd') . '-' . substr(uniqid(), -6);
}

// Function to send email
function sendEmail($to, $subject, $message, $replyTo = null, $attachments = []) {
    try {
        $mail = new PHPMailer(true);
        
        // Server settings
        $mail->isSMTP();
        $mail->Host = 'smtp.zone.eu';
        $mail->SMTPAuth = true;
        $mail->Username = 'leen@leen.ee';
        $mail->Password = 'your_password_here'; // Replace with actual password from env
        $mail->SMTPSecure = 'tls';
        $mail->Port = 587;
        $mail->CharSet = 'UTF-8';
        
        // Recipients
        $mail->setFrom('leen@leen.ee', 'Leen.ee');
        $mail->addAddress($to);
        
        if ($replyTo) {
            $mail->addReplyTo($replyTo);
        } else {
            $mail->addReplyTo('leen@leen.ee', 'Leen.ee');
        }
        
        // Add attachments if any
        if (!empty($attachments) && is_array($attachments)) {
            foreach ($attachments as $attachment) {
                if (isset($attachment['path']) && file_exists($attachment['path'])) {
                    $mail->addAttachment(
                        $attachment['path'],
                        isset($attachment['name']) ? $attachment['name'] : ''
                    );
                }
            }
        }
        
        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $message;
        
        // Create plain text version by stripping HTML
        $textBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $message));
        $mail->AltBody = $textBody;
        
        // Send email
        $mail->send();
        logMessage("Email sent successfully to $to with subject: $subject");
        return true;
    } catch (Exception $e) {
        logMessage("Email sending failed", "To: $to, Subject: $subject, Error: " . $mail->ErrorInfo);
        return false;
    }
}

/**
 * Send email using PHPMailer with SMTP
 * 
 * @param string $to Recipient email
 * @param string $subject Email subject
 * @param string $message Email body (HTML)
 * @param string $altMessage Plain text alternative
 * @param string $replyTo Reply-to email address
 * @return bool Success status
 */
function sendEmailWithPHPMailer($to, $subject, $message, $altMessage = '', $replyTo = 'leen@leen.ee') {
    global $logFile;
    
    try {
        $mail = new PHPMailer(true);
        
        // Server settings
        $mail->isSMTP();
        $mail->Host = 'smtp.zone.eu';
        $mail->SMTPAuth = true;
        $mail->Username = 'leen@leen.ee';
        $mail->Password = 'your_password_here'; // This should be loaded from environment variable
        $mail->SMTPSecure = 'tls';
        $mail->Port = 587;
        $mail->CharSet = 'UTF-8';
        
        // Recipients
        $mail->setFrom('leen@leen.ee', 'Leen.ee');
        $mail->addAddress($to);
        $mail->addReplyTo($replyTo, 'Leen Väränen');
        
        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $message;
        
        if (!empty($altMessage)) {
            $mail->AltBody = $altMessage;
        } else {
            // Generate plain text from HTML if not provided
            $mail->AltBody = strip_tags(str_replace(['<br>', '</p>'], ["\n", "\n\n"], $message));
        }
        
        $mail->send();
        logMessage("Email sent successfully to $to with subject: $subject");
        return true;
    } catch (Exception $e) {
        logMessage("Email sending failed to $to: " . $mail->ErrorInfo);
        return false;
    }
}

// Function to create or update order in Supabase
function processOrder($transactionData, $paymentData) {
    try {
        // Extract merchant data
        $merchantData = json_decode($transactionData->transaction->merchant_data ?? '{}', true);
        
        // Extract customer info
        $customerName = $merchantData['customer_name'] ?? '';
        $customerEmail = $merchantData['customer_email'] ?? '';
        $customerPhone = $merchantData['customer_phone'] ?? '';
        
        // Extract order items
        $items = $merchantData['items'] ?? [];
        
        // Generate order number if not exists
        $orderNumber = generateOrderNumber();
        
        // Check if order already exists with this reference
        $orderReference = $transactionData->transaction->reference ?? '';
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
            logMessage("Found existing order", ['id' => $orderId, 'order_number' => $orderNumber]);
        }
        
        // Determine order status based on payment status
        $orderStatus = 'PENDING';
        if ($paymentData->status === 'COMPLETED') {
            $orderStatus = 'PAID';
        } else if ($paymentData->status === 'CANCELLED') {
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
            'omniva_parcel_machine_name' => $merchantData['omnivaParcelMachineName'] ?? null
        ];
        
        // If order exists, update it
        if ($orderExists && $orderId) {
            logMessage("Updating existing order", ['id' => $orderId, 'status' => $orderStatus]);
            
            $updateResult = supabaseRequest(
                "/rest/v1/orders?id=eq.$orderId",
                'PATCH',
                $orderData
            );
            
            if ($updateResult['status'] !== 200 && $updateResult['status'] !== 204) {
                logMessage("Error updating order", $updateResult);
                return false;
            }
        } 
        // Otherwise create a new order
        else {
            logMessage("Creating new order", $orderData);
            
            $createResult = supabaseRequest(
                "/rest/v1/orders",
                'POST',
                $orderData
            );
            
            if ($createResult['status'] !== 201) {
                logMessage("Error creating order", $createResult);
                return false;
            }
            
            // Get the new order ID
            $getOrderResult = supabaseRequest(
                "/rest/v1/orders?order_number=eq.$orderNumber",
                'GET'
            );
            
            if ($getOrderResult['status'] !== 200 || empty($getOrderResult['data'])) {
                logMessage("Error retrieving created order", $getOrderResult);
                return false;
            }
            
            $orderId = $getOrderResult['data'][0]['id'] ?? null;
            
            if (!$orderId) {
                logMessage("Failed to get order ID for new order");
                return false;
            }
            
            logMessage("New order created", ['id' => $orderId, 'order_number' => $orderNumber]);
        }
        
        // Process order items
        if (!empty($items) && $orderId) {
            // First, delete any existing items for this order to avoid duplicates
            $deleteItemsResult = supabaseRequest(
                "/rest/v1/order_items?order_id=eq.$orderId",
                'DELETE'
            );
            
            logMessage("Deleted existing order items", $deleteItemsResult);
            
            // Then insert new items
            foreach ($items as $item) {
                $itemData = [
                    'order_id' => $orderId,
                    'product_id' => $item['id'],
                    'product_title' => $item['title'],
                    'quantity' => $item['quantity'] ?? 1,
                    'price' => $item['price']
                ];
                
                $createItemResult = supabaseRequest(
                    "/rest/v1/order_items",
                    'POST',
                    $itemData
                );
                
                if ($createItemResult['status'] !== 201) {
                    logMessage("Error creating order item", ['item' => $itemData, 'result' => $createItemResult]);
                }
                
                // Update product availability if needed
                if ($orderStatus === 'PAID' || $orderStatus === 'PROCESSING') {
                    $productId = $item['id'];
                    
                    // Get current product
                    $productResult = supabaseRequest(
                        "/rest/v1/products?id=eq.$productId",
                        'GET'
                    );
                    
                    if ($productResult['status'] === 200 && !empty($productResult['data'])) {
                        $product = $productResult['data'][0];
                        
                        // If product is available, mark as unavailable (sold)
                        if ($product['available']) {
                            $updateProductResult = supabaseRequest(
                                "/rest/v1/products?id=eq.$productId",
                                'PATCH',
                                ['available' => false]
                            );
                            
                            logMessage("Updated product availability", [
                                'product_id' => $productId, 
                                'available' => false,
                                'result' => $updateProductResult
                            ]);
                        }
                    }
                }
            }
        }
        
        // Record payment
        if ($orderId) {
            $paymentData = [
                'order_id' => $orderId,
                'transaction_id' => $paymentData->transaction ?? $transactionId,
                'payment_method' => $paymentData->method,
                'amount' => $paymentData->amount,
                'currency' => $paymentData->currency,
                'status' => $paymentData->status
            ];
            
            $createPaymentResult = supabaseRequest(
                "/rest/v1/order_payments",
                'POST',
                $paymentData
            );
            
            if ($createPaymentResult['status'] !== 201) {
                logMessage("Error creating payment record", ['payment' => $paymentData, 'result' => $createPaymentResult]);
            } else {
                logMessage("Payment record created", $paymentData);
            }
        }
        
        // Send confirmation email if payment is completed
        if ($paymentData->status === 'COMPLETED' && !empty($customerEmail)) {
            $subject = "Teie tellimus #{$orderNumber} on kinnitatud - Leen.ee";

            // Store the order reference in the merchant_data for later retrieval
            if ($transaction && isset($transaction->transaction) && isset($transaction->transaction->reference)) {
                $merchantData = json_decode($transaction->transaction->merchant_data ?? '{}', true);
                $merchantData['order_reference'] = $orderReference;
                
                // Store delivery method information in merchant_data
                if (isset($merchantData['deliveryMethod']) && $merchantData['deliveryMethod'] === 'omniva-parcel-machine') {
                    logMessage("Omniva delivery method detected", [
                        'parcelMachineId' => $merchantData['omnivaParcelMachineId'] ?? 'not set',
                        'parcelMachineName' => $merchantData['omnivaParcelMachineName'] ?? 'not set'
                    ]);
                }
                
                // Update the transaction with the new merchant_data
                try {
                    $MK->addTransactionMeta($transaction->transaction->id, [
                        'merchant_data' => json_encode($merchantData)
                    ]);
                } catch (Exception $e) {
                    logMessage("Error updating transaction meta: " . $e->getMessage());
                }
            }
            
            // Build a simple HTML email
            $emailMessage = "
            <html>
            <head>
                <title>Tellimuse kinnitus</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    h1 { color: #2f3e9c; }
                    .order-details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .item { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
                    .total { font-weight: bold; margin-top: 15px; }
                    .footer { margin-top: 30px; font-size: 0.9em; color: #777; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <h1>Täname teid ostu eest!</h1>
                    <p>Teie tellimus #{$orderNumber} on edukalt kinnitatud.</p>
                    <p><strong>Tellimuse viide:</strong> {$orderReference}</p>
                    <p><strong>Tellimuse viide:</strong> {$orderReference}</p>
                    
                    <div class='order-details'>
                        <h2>Tellimuse andmed:</h2>
                        <p><strong>Nimi:</strong> {$customerName}</p>
                        <p><strong>E-post:</strong> {$customerEmail}</p>
                        <p><strong>Telefon:</strong> {$customerPhone}</p>
                        <p><strong>Summa:</strong> {$transactionData->transaction->amount} {$transactionData->transaction->currency}</p>
                        
                        <!-- Display Omniva parcel machine info if applicable -->";
            
            if (isset($merchantData['deliveryMethod']) && $merchantData['deliveryMethod'] === 'omniva-parcel-machine' && !empty($merchantData['omnivaParcelMachineName'])) {
                $message .= "
                        <p><strong>Tarneviis:</strong> Omniva pakiautomaat</p>
                        <p><strong>Pakiautomaat:</strong> " . htmlspecialchars($merchantData['omnivaParcelMachineName']) . "</p>";
            }
            
            $message .= "
                    </div>
                    
                    <h2>Tellitud tooted:</h2>";
            
            // Add items to email
            foreach ($items as $item) {
                $itemPrice = number_format($item['price'], 2, '.', ' ');
                $message .= "
                <div class='item'>
                    <p><strong>{$item['title']}</strong></p>
                    <p>Kogus: {$item['quantity'] ?? 1} × {$itemPrice}€</p>
                </div>";
            }
            
            $message .= "
                    <p class='total'>Kokku: {$transactionData->transaction->amount} {$transactionData->transaction->currency}</p>
                    
                    <p>Täname, et valisite Leen.ee! Kui teil on küsimusi, võtke meiega ühendust aadressil leen@leen.ee.</p>
                    
                    <div class='footer'>
                        <p>Leen Väränen - Keraamika ja Rõivadisain</p>
                        <p>Jõeääre, Märjamaa, Rapla maakond</p>
                        <p><a href='https://leen.ee'>leen.ee</a></p>
                    </div>
                </div>
            </body>
            </html>
            ";

            // Send email to customer
            sendEmailWithPHPMailer($customerEmail, $subject, $emailMessage);

            // Also send notification to admin
            $adminEmail = "leen@leen.ee";
            $adminSubject = "Uus tellimus #{$orderNumber} - Leen.ee";
            sendEmailWithPHPMailer($adminEmail, $adminSubject, $emailMessage);
            
            // If this is an Omniva parcel machine order, register the shipment
            if (isset($merchantData['deliveryMethod']) && $merchantData['deliveryMethod'] === 'omniva-parcel-machine' && 
                !empty($merchantData['omnivaParcelMachineId'])) {
                
                logMessage("Initiating Omniva shipment registration for order", $orderId);
                
                // Make a request to the Omniva shipment registration script
                $omnivaData = [
                    'orderId' => $orderId,
                    'notifyAdmin' => true
                ];
                
                $ch = curl_init($_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/php/register-omniva-shipment.php');
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($omnivaData));
                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                curl_setopt($ch, CURLOPT_TIMEOUT, 30);
                
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $error = curl_error($ch);
                
                curl_close($ch);
                
                if ($error) {
                    logMessage("Error registering Omniva shipment", $error);
                } else { 
                    $responseData = json_decode($response, true);
                    logMessage("Omniva shipment registration response", $responseData);
                    
                    if ($httpCode >= 200 && $httpCode < 300 && isset($responseData['success']) && $responseData['success']) {
                        logMessage("Omniva shipment registered successfully", [
                            'barcode' => $responseData['barcode'] ?? 'not provided'
                        ]);
                    } else {
                        logMessage("Failed to register Omniva shipment", $responseData);
                    }
                }
            } else {
                logMessage("Not an Omniva parcel machine order or missing data", [
                    'deliveryMethod' => $merchantData['deliveryMethod'] ?? 'not set',
                    'omnivaParcelMachineId' => $merchantData['omnivaParcelMachineId'] ?? 'not set'
                ]);
            }
        }
        
        return true;
    } catch (Exception $e) {
        logMessage("Error processing order", $e->getMessage());
        return false;
    }
}

// Main execution starts here
try {
    // Log the notification
    $requestData = file_get_contents('php://input');
    logMessage("Notification received", $requestData);

    // Initialize Maksekeskus client
    $shopId = '4e2bed9a-aa24-4b87-801b-56c31c535d36';
    $publicKey = 'wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM';
    $privateKey = 'WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ';
    $testMode = false; // Set to false for production
    
    $MK = new Maksekeskus($shopId, $publicKey, $privateKey, $testMode);
    
    // Verify the notification
    $request = $_REQUEST;
    $isValid = $MK->verifyMac($request); 

    if (!$isValid) {
        logMessage("Invalid MAC signature");
        http_response_code(400);
        echo json_encode(['error' => 'Invalid signature']);
        exit();
    }
    
    logMessage("MAC signature verified successfully");
    
    // Extract the notification data
    $data = $MK->extractRequestData($request);
    logMessage("Extracted data", $data);
    
    // Get the transaction ID
    $transactionId = $data->transaction ?? null;

    if (!$transactionId) {
        logMessage("No transaction ID in notification", $data);
        http_response_code(400);
        echo json_encode(['error' => 'Missing transaction ID']);
        exit();
    }
    
    // Fetch the full transaction details from Maksekeskus
    try {
        $transaction = $MK->getTransaction($transactionId);
        logMessage("Transaction details fetched", $transaction);
    } catch (\Exception $e) {
        logMessage("Error fetching transaction details", $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch transaction details']);
        exit();
    }
    
    // Process the order in our database
    $success = processOrder($transaction, $data); 

    if ($success) {
        logMessage("Order processed successfully");
        echo json_encode(['status' => 'success']);
    } else {
        logMessage("Order processing failed");
        http_response_code(500);
        echo json_encode(['error' => 'Order processing failed']);
    }
} catch (MKException $e) {
    logMessage("Maksekeskus Exception", $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]); 
} catch (\Exception $e) {
    logMessage("General Exception", $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}