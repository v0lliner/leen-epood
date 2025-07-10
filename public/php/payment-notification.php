<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them

// Set up logging
$logDir = __DIR__ . '/../../logs';
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

// Require the Maksekeskus SDK
require __DIR__ . '/maksekeskus/vendor/autoload.php';
use Maksekeskus\Maksekeskus;

// Main execution starts here
try {
    // Log the notification
    logMessage("Makse teavitus saabunud", [
        'POST' => $_POST,
        'GET' => $_GET,
        'RAW' => file_get_contents('php://input')
    ]);

    // Initialize Maksekeskus client
    $shopId = '4e2bed9a-aa24-4b87-801b-56c31c535d36';
    $publicKey = 'wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM';
    $privateKey = 'WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ';
    $testMode = false; // Set to false for production
    
    $MK = new Maksekeskus($shopId, $publicKey, $privateKey, $testMode);
    
    // Check if required parameters exist
    if (!isset($_POST['json']) || !isset($_POST['mac'])) {
        logMessage("Puuduvad vajalikud parameetrid (json või mac)", $_POST);
        http_response_code(400);
        echo json_encode(['error' => 'Missing required parameters']);
        exit();
    }
    
    // Verify the notification
    $request = $_POST;
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
    
    // Get the transaction ID and reference
    $transactionId = isset($data['transaction']) ? $data['transaction'] : null;
    $reference = isset($data['reference']) ? $data['reference'] : null;
    $status = isset($data['status']) ? $data['status'] : null;

    if (!$transactionId) {
        logMessage("Tehingu ID puudub teavituses", $data);
        http_response_code(400);
        echo json_encode(['error' => 'Missing transaction ID']);
        exit();
    }
    
    logMessage("Tehingu andmed", [
        'transactionId' => $transactionId,
        'reference' => $reference,
        'status' => $status
    ]);
    
    // Fetch the full transaction details from Maksekeskus
    try {
        $transaction = $MK->getTransaction($transactionId);
        logMessage("Tehingu detailid edukalt laaditud", $transaction);
        
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
        
        // Process the order based on the transaction status
        if ($transaction->transaction->status === 'COMPLETED') {
            logMessage("Makse on COMPLETED staatuses, töötleme tellimust");
            
            // Process the order
            processOrder($transaction, $merchantData, $reference);
            
            // Return success response
            echo json_encode([
                'status' => 'success',
                'message' => 'Payment completed and order processed',
                'transactionId' => $transactionId,
                'reference' => $reference
            ]);
        } else {
            logMessage("Makse ei ole COMPLETED staatuses", [
                'status' => $transaction->transaction->status,
                'reference' => $reference
            ]);
            
            // Return success response but note the status
            echo json_encode([
                'status' => 'success',
                'message' => 'Payment notification received but status is not COMPLETED',
                'payment_status' => $transaction->transaction->status
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

/**
 * Process the order based on transaction data
 * 
 * @param object $transaction Transaction object from Maksekeskus
 * @param array $merchantData Decoded merchant_data from transaction
 * @param string $reference Transaction reference
 * @return bool Success status
 */
function processOrder($transaction, $merchantData, $reference) {
    try {
        logMessage("Alustame tellimuse töötlemist", [
            'reference' => $reference,
            'merchantData' => $merchantData
        ]);
        
        // Extract customer info
        $customerName = isset($merchantData['customer_name']) ? $merchantData['customer_name'] : '';
        $customerEmail = isset($merchantData['customer_email']) ? $merchantData['customer_email'] : '';
        $customerPhone = isset($merchantData['customer_phone']) ? $merchantData['customer_phone'] : '';
        
        // Extract delivery method and address
        $deliveryMethod = isset($merchantData['deliveryMethod']) ? $merchantData['deliveryMethod'] : '';
        $omnivaParcelMachineId = isset($merchantData['omnivaParcelMachineId']) ? $merchantData['omnivaParcelMachineId'] : null;
        $omnivaParcelMachineName = isset($merchantData['omnivaParcelMachineName']) ? $merchantData['omnivaParcelMachineName'] : null;
        
        // Extract order items
        $items = isset($merchantData['items']) ? $merchantData['items'] : [];
        
        // Connect to Supabase via REST API
        $supabaseUrl = 'https://epcenpirjkfkgdgxktrm.supabase.co';
        $supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY2VucGlyamtma2dkZ3hrdHJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExMzgwNCwiZXhwIjoyMDY2Njg5ODA0fQ.wbsLJEL_U-EHNkDe4CFt6-dPNpWHe50WKCQqsoyYdLs';
        
        // Check if order already exists with this reference
        $existingOrderQuery = makeSupabaseRequest(
            $supabaseUrl,
            $supabaseKey,
            "/rest/v1/orders?reference=eq.$reference",
            'GET'
        );
        
        $orderExists = false;
        $orderId = null;
        
        if ($existingOrderQuery['status'] === 200 && !empty($existingOrderQuery['data'])) {
            $orderExists = true;
            $orderId = $existingOrderQuery['data'][0]['id'] ?? null;
            $orderNumber = $existingOrderQuery['data'][0]['order_number'] ?? generateOrderNumber();
            logMessage("Leidsime olemasoleva tellimuse", ['id' => $orderId, 'order_number' => $orderNumber]);
        } else {
            $orderNumber = generateOrderNumber();
            logMessage("Olemasolevat tellimust ei leitud, loome uue", ['order_number' => $orderNumber]);
        }
        
        // Prepare order data
        $orderData = [
            'customer_name' => $customerName,
            'customer_email' => $customerEmail,
            'customer_phone' => $customerPhone,
            'total_amount' => $transaction->transaction->amount,
            'currency' => $transaction->transaction->currency,
            'status' => 'PAID', // Set to PAID when payment is completed
            'order_number' => $orderNumber,
            'reference' => $reference,
            'omniva_parcel_machine_id' => $omnivaParcelMachineId,
            'omniva_parcel_machine_name' => $omnivaParcelMachineName
        ];
        
        // Create or update order
        if ($orderExists && $orderId) {
            logMessage("Uuendame olemasolevat tellimust", ['id' => $orderId]);
            
            $updateResult = makeSupabaseRequest(
                $supabaseUrl,
                $supabaseKey,
                "/rest/v1/orders?id=eq.$orderId",
                'PATCH',
                $orderData
            );
            
            if ($updateResult['status'] !== 204) {
                logMessage("Viga tellimuse uuendamisel", $updateResult);
                return false;
            }
        } else {
            logMessage("Loome uue tellimuse", $orderData);
            
            $createResult = makeSupabaseRequest(
                $supabaseUrl,
                $supabaseKey,
                "/rest/v1/orders",
                'POST',
                $orderData
            );
            
            if ($createResult['status'] !== 201) {
                logMessage("Viga tellimuse loomisel", $createResult);
                return false;
            }
            
            // Get the new order ID
            $getOrderResult = makeSupabaseRequest(
                $supabaseUrl,
                $supabaseKey,
                "/rest/v1/orders?order_number=eq.$orderNumber",
                'GET'
            );
            
            if ($getOrderResult['status'] !== 200 || empty($getOrderResult['data'])) {
                logMessage("Viga loodud tellimuse ID saamisel", $getOrderResult);
                return false;
            }
            
            $orderId = $getOrderResult['data'][0]['id'] ?? null;
            
            if (!$orderId) {
                logMessage("Ei saanud tellimuse ID-d");
                return false;
            }
            
            logMessage("Uus tellimus loodud", ['id' => $orderId, 'order_number' => $orderNumber]);
        }
        
        // Process order items
        if (!empty($items) && $orderId) {
            // First, delete any existing items for this order to avoid duplicates
            $deleteItemsResult = makeSupabaseRequest(
                $supabaseUrl,
                $supabaseKey,
                "/rest/v1/order_items?order_id=eq.$orderId",
                'DELETE'
            );
            
            logMessage("Kustutasime olemasolevad tellimuse tooted", $deleteItemsResult);
            
            // Then insert new items
            foreach ($items as $item) {
                $itemData = [
                    'order_id' => $orderId,
                    'product_id' => $item['id'],
                    'product_title' => $item['title'],
                    'quantity' => $item['quantity'] ?? 1,
                    'price' => $item['price']
                ];
                
                $createItemResult = makeSupabaseRequest(
                    $supabaseUrl,
                    $supabaseKey,
                    "/rest/v1/order_items",
                    'POST',
                    $itemData
                );
                
                if ($createItemResult['status'] !== 201) {
                    logMessage("Viga tellimuse toote loomisel", ['item' => $itemData, 'result' => $createItemResult]);
                }
                
                // Update product availability if needed
                if ($transaction->transaction->status === 'COMPLETED') {
                    $productId = $item['id'];
                    
                    // Mark product as unavailable (sold) - every product is unique
                    $updateProductResult = makeSupabaseRequest(
                        $supabaseUrl,
                        $supabaseKey,
                        "/rest/v1/products?id=eq.$productId",
                        'PATCH',
                        ['available' => false]
                    );
                    
                    logMessage("Uuendasime toote saadavust", [
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
                'transaction_id' => $transaction->transaction->id,
                'payment_method' => $transaction->transaction->method ?? 'unknown',
                'amount' => $transaction->transaction->amount,
                'currency' => $transaction->transaction->currency,
                'status' => $transaction->transaction->status
            ];
            
            $createPaymentResult = makeSupabaseRequest(
                $supabaseUrl,
                $supabaseKey,
                "/rest/v1/order_payments",
                'POST',
                $paymentData
            );
            
            if ($createPaymentResult['status'] !== 201) {
                logMessage("Viga makse kirje loomisel", ['payment' => $paymentData, 'result' => $createPaymentResult]);
            } else {
                logMessage("Makse kirje loodud", $paymentData);
            }
        }
        
        // If this is an Omniva parcel machine order, register the shipment
        if ($transaction->transaction->status === 'COMPLETED' && 
            $deliveryMethod === 'omniva-parcel-machine' && 
            $omnivaParcelMachineId) {
            
            logMessage("Alustame Omniva saadetise registreerimist", [
                'orderId' => $orderId,
                'omnivaParcelMachineId' => $omnivaParcelMachineId
            ]);
            
            // Make a request to the Omniva shipment registration script
            $omnivaData = [
                'orderId' => $orderId,
                'sendNotification' => true
            ];
            
            $ch = curl_init('http://' . $_SERVER['HTTP_HOST'] . '/php/register-omniva-shipment.php');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($omnivaData));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            
            curl_close($ch);
            
            logMessage("Omniva saadetise registreerimise vastus", [
                'httpCode' => $httpCode, 
                'response' => $response, 
                'error' => $error
            ]);
        }
        
        // Send confirmation email to customer
        if ($transaction->transaction->status === 'COMPLETED' && !empty($customerEmail)) {
            logMessage("Saadame kinnituskirja kliendile", $customerEmail);
            
            // Send email using PHPMailer
            require_once __DIR__ . '/phpmailer/PHPMailer.php';
            require_once __DIR__ . '/phpmailer/SMTP.php';
            require_once __DIR__ . '/phpmailer/Exception.php';
            
            $mail = new PHPMailer\PHPMailer\PHPMailer(true);
            
            try {
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
                $mail->addAddress($customerEmail, $customerName);
                $mail->addReplyTo('leen@leen.ee', 'Leen Väränen');
                
                // Content
                $mail->isHTML(true);
                $mail->Subject = "Teie tellimus #{$orderNumber} on kinnitatud - Leen.ee";
                
                // Build HTML email
                $emailBody = buildOrderConfirmationEmail($orderNumber, $customerName, $items, $transaction, $omnivaParcelMachineName);
                
                $mail->Body = $emailBody;
                $mail->AltBody = strip_tags(str_replace(['<br>', '</p>'], ["\n", "\n\n"], $emailBody));
                
                $mail->send();
                logMessage("Kinnituskiri edukalt saadetud aadressile $customerEmail");
                
                // Also send notification to admin
                $mail->clearAddresses();
                $mail->addAddress('leen@leen.ee', 'Leen Väränen');
                $mail->Subject = "Uus tellimus #{$orderNumber} - Leen.ee";
                $mail->send();
                logMessage("Teavitus edukalt saadetud administraatorile");
                
            } catch (Exception $e) {
                logMessage("E-kirja saatmine ebaõnnestus", $mail->ErrorInfo);
            }
        }
        
        return true;
    } catch (Exception $e) {
        logMessage("Viga tellimuse töötlemisel", $e->getMessage());
        return false;
    }
}

/**
 * Make a request to Supabase REST API
 * 
 * @param string $supabaseUrl Supabase URL
 * @param string $supabaseKey Supabase API key
 * @param string $endpoint API endpoint
 * @param string $method HTTP method
 * @param array $data Request data (for POST, PATCH)
 * @return array Response data and status code
 */
function makeSupabaseRequest($supabaseUrl, $supabaseKey, $endpoint, $method = 'GET', $data = null) {
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

/**
 * Generate a unique order number
 * 
 * @return string Order number
 */
function generateOrderNumber() {
    return 'ORD-' . date('Ymd') . '-' . substr(uniqid(), -6);
}

/**
 * Build HTML email for order confirmation
 * 
 * @param string $orderNumber Order number
 * @param string $customerName Customer name
 * @param array $items Order items
 * @param object $transaction Transaction object
 * @param string $omnivaParcelMachineName Omniva parcel machine name
 * @return string HTML email content
 */
function buildOrderConfirmationEmail($orderNumber, $customerName, $items, $transaction, $omnivaParcelMachineName) {
    $serverName = $_SERVER['SERVER_NAME'] ?? 'leen.ee';
    
    $emailBody = '
        <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; }
                    .header { background-color: #2f3e9c; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .order-details { background-color: #f5f5f5; padding: 15px; margin: 15px 0; }
                    .item { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
                    .total { font-weight: bold; margin-top: 15px; }
                    .footer { margin-top: 30px; font-size: 0.9em; color: #777; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Täname teid ostu eest!</h1>
                    </div>
                    <div class="content">
                        <p>Tere, <strong>' . htmlspecialchars($customerName) . '</strong>!</p>
                        <p>Teie tellimus #' . htmlspecialchars($orderNumber) . ' on edukalt vormistatud ja makse on kinnitatud.</p>
                        
                        <div class="order-details">
                            <h2>Tellimuse andmed:</h2>
                            <p><strong>Tellimuse number:</strong> ' . htmlspecialchars($orderNumber) . '</p>
                            <p><strong>Tellimuse viide:</strong> ' . htmlspecialchars($transaction->transaction->reference) . '</p>
                            <p><strong>Summa:</strong> ' . htmlspecialchars($transaction->transaction->amount) . ' ' . htmlspecialchars($transaction->transaction->currency) . '</p>';
    
    if ($omnivaParcelMachineName) {
        $emailBody .= '
                            <p><strong>Tarneviis:</strong> Omniva pakiautomaat</p>
                            <p><strong>Pakiautomaat:</strong> ' . htmlspecialchars($omnivaParcelMachineName) . '</p>';
    }
    
    $emailBody .= '
                        </div>
                        
                        <h2>Tellitud tooted:</h2>';
    
    foreach ($items as $item) {
        $itemPrice = number_format($item['price'], 2, '.', ' ');
        $emailBody .= '
                        <div class="item">
                            <p><strong>' . htmlspecialchars($item['title']) . '</strong></p>
                            <p>Kogus: ' . htmlspecialchars($item['quantity'] ?? 1) . ' × ' . htmlspecialchars($itemPrice) . '€</p>
                        </div>';
    }
    
    $emailBody .= '
                        <p class="total">Kokku: ' . htmlspecialchars($transaction->transaction->amount) . ' ' . htmlspecialchars($transaction->transaction->currency) . '</p>
                        
                        <p>Täname, et valisite Leen.ee! Kui teil on küsimusi, võtke meiega ühendust aadressil leen@leen.ee.</p>
                        
                        <div class="footer">
                            <p>Leen Väränen - Keraamika ja Rõivadisain</p>
                            <p>Jõeääre, Märjamaa, Rapla maakond</p>
                            <p><a href="https://leen.ee">leen.ee</a></p>
                        </div>
                    </div>
                </div>
            </body>
        </html>';
    
    return $emailBody;
}