<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them

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

// Function to create or update order in Supabase
function createOrUpdateOrder($orderData, $reference) {
    logMessage("Creating or updating order in Supabase", ['reference' => $reference]);
    
    // First check if order exists
    $existingOrder = getOrderByReference($reference);
    
    if ($existingOrder) {
        // Order exists, update it
        logMessage("Order exists, updating", ['id' => $existingOrder['id']]);
        return updateOrder($existingOrder['id'], $orderData);
    } else {
        // Order doesn't exist, create it
        logMessage("Order doesn't exist, creating new order");
        return createOrder($orderData);
    }
}

// Function to get order by reference
function getOrderByReference($reference) {
    logMessage("Getting order by reference", $reference);
    
    $result = supabaseRequest(
        "/rest/v1/orders?reference=eq.$reference&select=*",
        'GET'
    );
    
    if ($result['status'] !== 200) {
        logMessage("Error getting order by reference", ['status' => $result['status'], 'error' => $result['error'] ?? 'Unknown error']);
        return null;
    }
    
    if (empty($result['data'])) {
        logMessage("No order found with reference", $reference);
        return null;
    }
    
    return $result['data'][0];
}

// Function to create a new order
function createOrder($orderData) {
    logMessage("Creating new order", $orderData);
    
    $result = supabaseRequest(
        "/rest/v1/orders",
        'POST',
        $orderData
    );
    
    if ($result['status'] !== 201) {
        logMessage("Error creating order", ['status' => $result['status'], 'error' => $result['error'] ?? 'Unknown error']);
        return false;
    }
    
    logMessage("Order created successfully", $result['data']);
    return $result['data'];
}

// Function to update an existing order
function updateOrder($orderId, $orderData) {
    logMessage("Updating order", ['id' => $orderId, 'data' => $orderData]);
    
    $result = supabaseRequest(
        "/rest/v1/orders?id=eq.$orderId",
        'PATCH',
        $orderData
    );
    
    if ($result['status'] !== 204) {
        logMessage("Error updating order", ['status' => $result['status'], 'error' => $result['error'] ?? 'Unknown error']);
        return false;
    }
    
    logMessage("Order updated successfully", ['id' => $orderId]);
    return true;
}

// Function to create order payment record
function createOrderPayment($orderData, $transactionId, $status, $amount, $currency, $paymentMethod) {
    logMessage("Creating order payment record", [
        'order_id' => $orderData['id'],
        'transaction_id' => $transactionId,
        'status' => $status
    ]);
    
    $paymentData = [
        'order_id' => $orderData['id'],
        'transaction_id' => $transactionId,
        'payment_method' => $paymentMethod,
        'amount' => $amount,
        'currency' => $currency,
        'status' => $status
    ];
    
    $result = supabaseRequest(
        "/rest/v1/order_payments",
        'POST',
        $paymentData
    );
    
    if ($result['status'] !== 201) {
        logMessage("Error creating order payment", ['status' => $result['status'], 'error' => $result['error'] ?? 'Unknown error']);
        return false;
    }
    
    logMessage("Order payment created successfully", $result['data']);
    return $result['data'];
}

// Function to create order items
function createOrderItems($orderId, $items) {
    logMessage("Creating order items", ['order_id' => $orderId, 'items_count' => count($items)]);
    
    $success = true;
    
    foreach ($items as $item) {
        $orderItemData = [
            'order_id' => $orderId,
            'product_id' => $item['id'],
            'product_title' => $item['title'],
            'quantity' => $item['quantity'] ?? 1,
            'price' => $item['price']
        ];
        
        $result = supabaseRequest(
            "/rest/v1/order_items",
            'POST',
            $orderItemData
        );
        
        if ($result['status'] !== 201) {
            logMessage("Error creating order item", ['status' => $result['status'], 'error' => $result['error'] ?? 'Unknown error']);
            $success = false;
        }
    }
    
    if ($success) {
        logMessage("All order items created successfully");
    }
    
    return $success;
}

// Function to send email notification
function sendEmailNotification($to, $subject, $message) {
    logMessage("Sending email notification", ['to' => $to, 'subject' => $subject]);
    
    // Load PHPMailer
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
        $mail->Password = 'Leeeen484!'; // In production, this should be stored securely
        $mail->SMTPSecure = 'tls';
        $mail->Port = 587;
        $mail->CharSet = 'UTF-8';
        
        // Recipients
        $mail->setFrom('leen@leen.ee', 'Leen.ee');
        $mail->addAddress($to);
        $mail->addReplyTo('leen@leen.ee', 'Leen Väränen');
        
        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $message;
        $mail->AltBody = strip_tags(str_replace(['<br>', '</p>'], ["\n", "\n\n"], $message));
        
        $mail->send();
        logMessage("Email sent successfully to", $to);
        return true;
    } catch (Exception $e) {
        logMessage("Failed to send email", $mail->ErrorInfo);
        return false;
    }
}

// Function to register Omniva shipment
function registerOmnivaShipment($orderData, $reference) {
    logMessage("Registering Omniva shipment", ['reference' => $reference]);
    
    // Check if this order has a parcel machine ID
    if (empty($orderData['omniva_parcel_machine_id'])) {
        logMessage("Not an Omniva parcel machine order", $orderData);
        return false;
    }
    
    // Check if shipment is already registered
    if (!empty($orderData['omniva_barcode'])) {
        logMessage("Shipment already registered", $orderData['omniva_barcode']);
        return $orderData['omniva_barcode'];
    }
    
    try {
        // Initialize Omniva shipment
        require_once __DIR__ . '/omniva/vendor/autoload.php';
        
        $shipment = new \Mijora\Omniva\Shipment\Shipment();
        $shipment->setComment("Order #" . ($orderData['order_number'] ?? $reference));
        
        // Set shipment header
        $shipmentHeader = new \Mijora\Omniva\Shipment\ShipmentHeader();
        $shipmentHeader
            ->setSenderCd('247723') // Omniva customer code
            ->setFileId(date('YmdHis'));
        $shipment->setShipmentHeader($shipmentHeader);
        
        // Create package
        $package = new \Mijora\Omniva\Shipment\Package\Package();
        $package
            ->setId($orderData['order_number'] ?? $reference)
            ->setService('PU'); // PU = Parcel machine service
        
        // Set package measurements
        $measures = new \Mijora\Omniva\Shipment\Package\Measures();
        $measures
            ->setWeight(1.0) // Default weight if not specified
            ->setLength(0.3)
            ->setWidth(0.3)
            ->setHeight(0.3);
        $package->setMeasures($measures);
        
        // Set receiver contact info
        $receiverContact = new \Mijora\Omniva\Shipment\Package\Contact();
        $receiverAddress = new \Mijora\Omniva\Shipment\Package\Address();
        $receiverAddress
            ->setCountry('EE') // Hardcoded to Estonia for now
            ->setOffloadPostcode($orderData['omniva_parcel_machine_id']);
        
        $receiverContact
            ->setAddress($receiverAddress)
            ->setMobile($orderData['customer_phone'])
            ->setEmail($orderData['customer_email'])
            ->setPersonName($orderData['customer_name']);
        
        $package->setReceiverContact($receiverContact);
        
        // Set sender contact info
        $senderContact = new \Mijora\Omniva\Shipment\Package\Contact();
        $senderAddress = new \Mijora\Omniva\Shipment\Package\Address();
        $senderAddress
            ->setCountry('EE')
            ->setPostcode('79631')
            ->setDeliverypoint('Märjamaa')
            ->setStreet('Jõeääre, Kuku küla');
        
        $senderContact
            ->setAddress($senderAddress)
            ->setMobile('+37253801413')
            ->setEmail('leen@leen.ee')
            ->setPersonName('Leen Väränen')
            ->setCompanyName('PopLeen OÜ');
        
        $package->setSenderContact($senderContact);
        
        // Add package to shipment
        $shipment->setPackages([$package]);
        
        // Set authentication
        $shipment->setAuth('247723', 'Ddg(8?e:$A');
        
        // Register shipment
        logMessage("Calling shipment->registerShipment()");
        $result = $shipment->registerShipment();
        logMessage("Shipment registration result", $result);
        
        if (isset($result['barcodes']) && !empty($result['barcodes'])) {
            $barcode = $result['barcodes'][0];
            
            // Update order with Omniva details
            $updateResult = updateOrderWithOmnivaDetails($orderData['id'], $barcode);
            logMessage("Order updated with barcode", ['success' => $updateResult, 'barcode' => $barcode]);
            
            // Generate and save PDF label
            $labelUrl = saveLabelPDF($barcode, $orderData['order_number'] ?? $reference);
            
            // Create tracking URL
            $trackingUrl = "https://www.omniva.ee/track?barcode=$barcode";
            
            // Update order with tracking URL and label URL
            if ($labelUrl) {
                updateOrderWithTrackingDetails($orderData['id'], $trackingUrl, $labelUrl);
            }
            
            return $barcode;
        } else {
            logMessage("No barcode received from Omniva API", $result);
            return false;
        }
    } catch (Exception $e) {
        logMessage("Error registering Omniva shipment", $e->getMessage());
        return false;
    }
}

// Function to update order with Omniva details
function updateOrderWithOmnivaDetails($orderId, $barcode) {
    logMessage("Updating order with Omniva details", ['orderId' => $orderId, 'barcode' => $barcode]);
    
    $updateResult = supabaseRequest(
       "/rest/v1/orders?id=eq.$orderId",
       'PATCH',
       [
           'omniva_barcode' => $barcode,
           'tracking_url' => "https://www.omniva.ee/track?barcode=$barcode",
           'shipment_registered_at' => date('c') // ISO 8601 format
       ]
    );
    
    $success = $updateResult['status'] === 204;
    logMessage("Order update result", ['success' => $success, 'status' => $updateResult['status']]);
    return $success;
}

// Function to save PDF label
function saveLabelPDF($barcode, $orderNumber) {
    try {
        // Initialize Omniva label class
        $label = new \Mijora\Omniva\Shipment\Label();
        logMessage("Generating PDF label for barcode", $barcode);
        
        // Omniva API credentials
        $label->setAuth('247723', 'Ddg(8?e:$A');
        
        // Create directory if it doesn't exist
        $pdfDir = __DIR__ . '/../pdf_labels';
        if (!is_dir($pdfDir)) {
            mkdir($pdfDir, 0755, true);
            logMessage("Created PDF directory", $pdfDir);
        }
        
        // Generate filename
        $filename = 'omniva_' . preg_replace('/[^a-zA-Z0-9]/', '_', $orderNumber) . '_' . $barcode;
        
        // Download label and save to file
        $label->downloadLabels([$barcode], false, 'F', $filename, false);
        
        // Return public URL path
        return '/pdf_labels/' . $filename . '.pdf';
    } catch (Exception $e) {
        logMessage("Error saving label PDF", $e->getMessage());
        return null;
    }
}

// Function to update order with tracking details
function updateOrderWithTrackingDetails($orderId, $trackingUrl, $labelUrl) {
    logMessage("Updating order with tracking details", [
        'orderId' => $orderId, 
        'trackingUrl' => $trackingUrl, 
        'labelUrl' => $labelUrl
    ]);
    
    $updateData = [
       'tracking_url' => $trackingUrl,
       'label_url' => $labelUrl
    ];
    
    $result = supabaseRequest(
        "/rest/v1/orders?id=eq.$orderId",
        'PATCH',
        $updateData
    );
    
    $success = $result['status'] === 204;
    logMessage("Order tracking update result", ['success' => $success, 'status' => $result['status']]);
    return $success;
}

// Function to send notification email with tracking info
function sendOrderConfirmationEmail($orderData, $barcode = null, $trackingUrl = null) {
    logMessage("Sending order confirmation email", [
        'email' => $orderData['customer_email'],
        'orderNumber' => $orderData['order_number'] ?? $orderData['reference']
    ]);
    
    $orderNumber = $orderData['order_number'] ?? $orderData['reference'];
    
    // Build HTML email
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
                .tracking-info { background-color: #e6f7ff; padding: 15px; margin: 15px 0; border-left: 4px solid #2f3e9c; }
                .button { display: inline-block; background-color: #2f3e9c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
                .footer { font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Tellimus kinnitatud</h1>
                </div>
                <div class="content">
                    <p>Tere, <strong>' . $orderData['customer_name'] . '</strong>!</p>
                    <p>Täname teid ostu eest! Teie tellimus on edukalt vormistatud ja makse on kinnitatud.</p>
                    
                    <div class="order-details">
                        <h3>Tellimuse info:</h3>
                        <p><strong>Tellimuse number:</strong> ' . $orderNumber . '</p>
                        <p><strong>Summa:</strong> ' . $orderData['total_amount'] . ' ' . $orderData['currency'] . '</p>
                    </div>';
    
    // Add tracking info if available
    if ($barcode && $trackingUrl) {
        $emailBody .= '
                    <div class="tracking-info">
                        <h3>Saadetise info:</h3>
                        <p><strong>Pakiautomaat:</strong> ' . $orderData['omniva_parcel_machine_name'] . '</p>
                        <p><strong>Jälgimiskood:</strong> ' . $barcode . '</p>
                        <p><a href="' . $trackingUrl . '" class="button">Jälgi saadetist</a></p>
                    </div>';
    } else if ($orderData['omniva_parcel_machine_name']) {
        $emailBody .= '
                    <div class="tracking-info">
                        <h3>Tarneinfo:</h3>
                        <p><strong>Pakiautomaat:</strong> ' . $orderData['omniva_parcel_machine_name'] . '</p>
                        <p>Saadame teile jälgimiskoodi niipea, kui saadetis on registreeritud.</p>
                    </div>';
    }
    
    $emailBody .= '
                    <p>Kui teil on küsimusi, võtke meiega ühendust aadressil <a href="mailto:leen@leen.ee">leen@leen.ee</a>.</p>
                </div>
                <div class="footer">
                    <p>See on automaatne teavitus Leen.ee e-poest.</p>
                </div>
            </div>
        </body>
    </html>';
    
    // Send email
    return sendEmailNotification(
        $orderData['customer_email'],
        "Tellimus #$orderNumber kinnitatud - Leen.ee",
        $emailBody
    );
}

// Function to send admin notification
function sendAdminNotification($orderData, $barcode = null, $trackingUrl = null) {
    logMessage("Sending admin notification email");
    
    $orderNumber = $orderData['order_number'] ?? $orderData['reference'];
    
    // Build HTML email
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
                .tracking-info { background-color: #e6f7ff; padding: 15px; margin: 15px 0; border-left: 4px solid #2f3e9c; }
                .button { display: inline-block; background-color: #2f3e9c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
                .footer { font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Uus tellimus</h1>
                </div>
                <div class="content">
                    <p>Uus tellimus on saabunud ja makse on kinnitatud.</p>
                    
                    <div class="order-details">
                        <h3>Tellimuse info:</h3>
                        <p><strong>Tellimuse number:</strong> ' . $orderNumber . '</p>
                        <p><strong>Klient:</strong> ' . $orderData['customer_name'] . '</p>
                        <p><strong>E-post:</strong> ' . $orderData['customer_email'] . '</p>
                        <p><strong>Telefon:</strong> ' . $orderData['customer_phone'] . '</p>
                        <p><strong>Summa:</strong> ' . $orderData['total_amount'] . ' ' . $orderData['currency'] . '</p>';
    
    if ($orderData['omniva_parcel_machine_name']) {
        $emailBody .= '
                        <p><strong>Pakiautomaat:</strong> ' . $orderData['omniva_parcel_machine_name'] . '</p>';
    }
    
    $emailBody .= '
                    </div>';
    
    // Add tracking info if available
    if ($barcode && $trackingUrl) {
        $emailBody .= '
                    <div class="tracking-info">
                        <h3>Saadetise info:</h3>
                        <p><strong>Jälgimiskood:</strong> ' . $barcode . '</p>
                        <p><a href="' . $trackingUrl . '" class="button">Jälgi saadetist</a></p>
                    </div>';
    }
    
    $emailBody .= '
                    <p><a href="https://leen.ee/admin/orders" class="button">Vaata tellimusi</a></p>
                </div>
                <div class="footer">
                    <p>See on automaatne teavitus Leen.ee e-poest.</p>
                </div>
            </div>
        </body>
    </html>';
    
    // Send email to admin
    return sendEmailNotification(
        'leen@leen.ee',
        "Uus tellimus #$orderNumber - Leen.ee",
        $emailBody
    );
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
        
        // Process the order in database
        if ($status === 'COMPLETED') {
            logMessage("Makse on COMPLETED staatuses, töötleme tellimust");
            
            // Extract merchant data
            $merchantData = json_decode($transaction->transaction->merchant_data ?? '{}', true);
            logMessage("Kaupmeheandmed", $merchantData);
            
            if (empty($merchantData)) {
                logMessage("Kaupmeheandmed on tühjad või vigased", $merchantDataString);
                http_response_code(400);
                echo json_encode(['error' => 'Invalid merchant data']);
                exit();
            }
            
            // Prepare order data for Supabase
            $orderData = [
                'reference' => $reference,
                'customer_name' => $merchantData['customer_name'] ?? '',
                'customer_email' => $merchantData['customer_email'] ?? '',
                'customer_phone' => $merchantData['customer_phone'] ?? '',
                'total_amount' => floatval($data['amount']),
                'currency' => $data['currency'],
                'status' => 'PAID', // Set to PAID when payment is completed
                'notes' => $merchantData['notes'] ?? '',
            ];
            
            // Add Omniva details if present
            if (isset($merchantData['deliveryMethod']) && $merchantData['deliveryMethod'] === 'omniva') {
                $orderData['omniva_parcel_machine_id'] = $merchantData['omnivaParcelMachineId'] ?? null;
                $orderData['omniva_parcel_machine_name'] = $merchantData['omnivaParcelMachineName'] ?? null;
            }
            
            // Create or update order in Supabase
            $order = createOrUpdateOrder($orderData, $reference);
            
            if (!$order) {
                logMessage("Tellimuse loomine või uuendamine ebaõnnestus");
                http_response_code(500);
                echo json_encode(['error' => 'Failed to create or update order']);
                exit();
            }
            
            // If we have a new order, create order items
            if (is_array($order) && isset($order['id']) && isset($merchantData['items']) && is_array($merchantData['items'])) {
                createOrderItems($order['id'], $merchantData['items']);
                
                // Create payment record
                createOrderPayment(
                    $order, 
                    $transactionId, 
                    'COMPLETED', 
                    floatval($data['amount']), 
                    $data['currency'],
                    $transaction->method ?? 'unknown'
                );
                
                // Get the updated order data
                $updatedOrder = getOrderByReference($reference);
                
                // Register Omniva shipment if needed
                $barcode = null;
                $trackingUrl = null;
                
                if (isset($merchantData['deliveryMethod']) && $merchantData['deliveryMethod'] === 'omniva' && $updatedOrder) {
                    $barcode = registerOmnivaShipment($updatedOrder, $reference);
                    
                    if ($barcode) {
                        $trackingUrl = "https://www.omniva.ee/track?barcode=$barcode";
                    }
                }
                
                // Send email notifications
                if ($updatedOrder) {
                    // Send confirmation to customer
                    sendOrderConfirmationEmail($updatedOrder, $barcode, $trackingUrl);
                    
                    // Send notification to admin
                    sendAdminNotification($updatedOrder, $barcode, $trackingUrl);
                }
            }
            
            // Here you would update your database with the order status
            // For now, we'll just log the success
            logMessage("Tellimus edukalt töödeldud", [
                'reference' => $reference,
                'status' => $status,
                'amount' => $data['amount'] ?? null,
                'currency' => $data['currency'] ?? null
            ]);
            
            // Return success response
            echo json_encode([
                'status' => 'success',
                'message' => 'Payment notification processed successfully'
            ]);
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