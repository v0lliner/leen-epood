<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0);

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
   
   file_put_contents($logFile, $logEntry . "\n", FILE_APPEND);
    if ($result === false) {
        error_log("Failed to write to log file: $logFile");
    }
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
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Include PHPMailer
require_once __DIR__ . '/phpmailer/PHPMailer.php';
require_once __DIR__ . '/phpmailer/SMTP.php';
require_once __DIR__ . '/phpmailer/Exception.php';

// Initialize Maksekeskus client with your credentials
$shopId = '4e2bed9a-aa24-4b87-801b-56c31c535d36';
$publicKey = 'wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM';
$privateKey = 'WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ';
$testMode = false; // Set to false for production

try {
    $MK = new Maksekeskus($shopId, $publicKey, $privateKey, $testMode);

    // Verify the notification
    $request = $_POST;

    // Check if required parameters exist
    if (!isset($request['json']) || !isset($request['mac'])) {
        logMessage("Puuduvad vajalikud parameetrid (json või mac)", $request);
        http_response_code(400);
        echo json_encode(['error' => 'Missing required parameters']);
        exit();
    }
    
    logMessage("MAC signatuur edukalt kontrollitud");
    
    // Extract the notification data
    $data = $MK->extractRequestData($request);
        exit();
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
        
        // Process the order in database
        if ($status === 'COMPLETED') {
            logMessage("Makse on COMPLETED staatuses, töötleme tellimust");
            
            // Extract merchant data
            $merchantData = null;
            if (isset($transaction->transaction->merchant_data)) {
                $merchantData = json_decode($transaction->transaction->merchant_data, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    logMessage("Merchant data JSON decode error", json_last_error_msg());
                    $merchantData = [];
                }
            } else {
                $merchantData = [];
            }
            
            logMessage("Kaupmeheandmed", $merchantData);
            
            // Process the order
            $success = processOrder($transaction, $data);
            
            if ($success) {
                logMessage("Tellimus edukalt töödeldud");
                echo json_encode(['success' => true, 'message' => 'Order processed successfully']);
            } else {
                logMessage("Tellimuse töötlemine ebaõnnestus");
                http_response_code(500);
                echo json_encode(['error' => 'Order processing failed']);
            }
        } else {
            logMessage("Makse ei ole COMPLETED staatuses", [
                'status' => $status,
                'reference' => $reference
            ]);
            
            // Return success response but note the status
            echo json_encode([
                'status' => 'success',
                'message' => 'Payment notification received but status is not COMPLETED',
                'payment_status' => $status
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

// Function to create or update order in Supabase
function processOrder($transactionData, $paymentData) {
    try {
        logMessage("Starting processOrder function", [
            'transactionData' => isset($transactionData) ? 'present' : 'missing', 
            'paymentData' => isset($paymentData) ? 'present' : 'missing'
        ]);
        
        // Extract merchant data
        $merchantData = [];
        if (isset($transactionData->transaction->merchant_data)) {
            $merchantData = json_decode($transactionData->transaction->merchant_data, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                logMessage("Error decoding merchant data", json_last_error_msg());
                $merchantData = [];
            }
        }
        
        logMessage("Extracted merchant data", $merchantData);
        logMessage("Transaction reference", $transactionData->transaction->reference ?? 'no reference');
        
        // Extract customer info
        $customerName = $merchantData['customer_name'] ?? '';
        $customerEmail = $merchantData['customer_email'] ?? '';
        $customerPhone = $merchantData['customer_phone'] ?? '';
        
        // Extract order items
        $items = $merchantData['items'] ?? [];
        
        // Generate order number if not exists
        $orderNumber = generateOrderNumber();
        logMessage("Generated order number", $orderNumber);
        
        // Check if order already exists with this reference
        $orderReference = $transactionData->transaction->reference ?? '';
        logMessage("Checking for existing order with reference", $orderReference);

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
                logMessage("cURL Error", $error);
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
            logMessage("Found existing order", ['id' => $orderId, 'order_number' => $orderNumber]);
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
            logMessage("Updating existing order", ['id' => $orderId, 'status' => $orderStatus]);
            
            $updateResult = supabaseRequest(
                "/rest/v1/orders?id=eq.$orderId",
                'PATCH',
                $orderData
            );
            
            if ($updateResult['status'] !== 204) {
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
            logMessage("Retrieving new order ID", $orderNumber);
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
            logMessage("Deleting existing order items for order", $orderId);
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
                
                logMessage("Creating order item", $itemData);
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
                    
                    // Mark product as unavailable (sold) - every product is unique
                    logMessage("Updating product availability to false", ['product_id' => $productId]);
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
        
        // Record payment
        if ($orderId) {
            $paymentData = [
                'order_id' => $orderId,
                'transaction_id' => $paymentData['transaction'] ?? $transactionId,
                'payment_method' => $paymentData['method'] ?? $transactionData->transaction->method ?? 'unknown',
                'amount' => $paymentData['amount'] ?? $transactionData->transaction->amount,
                'currency' => $paymentData['currency'] ?? $transactionData->transaction->currency,
                'status' => $paymentData['status'] ?? 'PENDING'
            ];
            
            logMessage("Creating payment record", $paymentData);
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
        if ($paymentData['status'] === 'COMPLETED' && !empty($customerEmail)) {
            logMessage("Sending confirmation email to customer", $customerEmail);
            $subject = "Teie tellimus #{$orderNumber} on kinnitatud - Leen.ee";
            
            // Build a simple HTML email
            $message = "
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
            sendEmail($customerEmail, $subject, $message);
            
            // Also send notification to admin
            logMessage("Sending notification email to admin", "leen@leen.ee");
            $adminEmail = "leen@leen.ee";
            $adminSubject = "Uus tellimus #{$orderNumber} - Leen.ee";
            sendEmail($adminEmail, $adminSubject, $message);
            
            // If this is an Omniva parcel machine order, register the shipment
            if (isset($merchantData['deliveryMethod']) && $merchantData['deliveryMethod'] === 'omniva-parcel-machine' && 
                !empty($merchantData['omnivaParcelMachineId'])) {
                
                logMessage("Initiating Omniva shipment registration for order", $orderId);
                
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
                
                logMessage("Omniva shipment registration request sent", $omnivaData);
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $error = curl_error($ch);
                
                curl_close($ch);
                
                logMessage("Omniva shipment registration response received", ['httpCode' => $httpCode, 'response' => $response, 'error' => $error]);
                
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
        logMessage("Exception in processOrder", $e->getMessage());
        return false;
    }
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
        $mail->Password = 'Leeeen484!';
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