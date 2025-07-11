<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Load environment variables
require_once __DIR__ . '/env-loader.php';

// Set up logging
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0777, true);
}
$shipmentLogFile = $logDir . '/omniva_shipment.log';

// Function to log messages
function shipmentLog($message, $data = null) {
    global $shipmentLogFile;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "$timestamp - $message";
    
    if ($data !== null) {
        $logEntry .= ": " . (is_string($data) ? $data : json_encode($data));
    }
    
    file_put_contents($shipmentLogFile, $logEntry . "\n", FILE_APPEND);
}

// Set up logging
$logDir = __DIR__ . '/../logs';
$logFile = $logDir . '/omniva_shipment_log.txt';

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

// Require the Omniva SDK
require __DIR__ . '/omniva/vendor/autoload.php';

use Mijora\Omniva\OmnivaException;
use Mijora\Omniva\Shipment\Package\Address;
use Mijora\Omniva\Shipment\Package\Contact;
use Mijora\Omniva\Shipment\Package\Measures;
use Mijora\Omniva\Shipment\Package\Package;
use Mijora\Omniva\Shipment\Shipment;
use Mijora\Omniva\Shipment\ShipmentHeader;

// Log file for debugging
$logFile = __DIR__ . '/omniva_shipment_log.txt';

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

// Function to get order details by ID
function getOrderDetails($orderId) {
    shipmentLog("Getting order details for order ID", $orderId);
    $orderResult = supabaseRequest("/rest/v1/orders?id=eq.$orderId", 'GET');
    
    if ($orderResult['status'] !== 200 || empty($orderResult['data'])) {
        shipmentLog("Order not found", $orderId);
        return null;
    }
    
    $order = $orderResult['data'][0];
    
    // Get order items
    $itemsResult = supabaseRequest(
        "/rest/v1/order_items?order_id=eq.$orderId&select=*,products(weight,dimensions)",
        'GET'
    );
    
    if ($itemsResult['status'] === 200) {
        shipmentLog("Found order items", count($itemsResult['data']));
        $order['items'] = $itemsResult['data'];
    } else {
        shipmentLog("No order items found", $itemsResult);
        $order['items'] = [];
    }
    
    return $order;
}

// Function to update order with Omniva shipment details
function updateOrderWithOmnivaDetails($orderId, $barcode) {
    shipmentLog("Updating order with Omniva details", ['orderId' => $orderId, 'barcode' => $barcode]);
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
    shipmentLog("Order update result", ['success' => $success, 'status' => $updateResult['status']]);
    return $success;
}

// Function to save PDF label
function saveLabelPDF($barcode, $orderNumber) {
    try {
        shipmentLog("Generating PDF label for barcode", $barcode);
        
        // Create PDF labels directory if it doesn't exist
        $pdfDir = __DIR__ . '/../pdf_labels';
        if (!is_dir($pdfDir)) {
            mkdir($pdfDir, 0777, true);
        }
        
        // Initialize Omniva label class
        $label = new \Mijora\Omniva\Shipment\Label();
        
        // Get Omniva credentials
        $customerCode = '247723'; // Replace with your actual customer code
        $username = '247723';     // Replace with your actual username
        $password = 'Ddg(8?e:$A'; // Replace with your actual password
        
        $label->setAuth($username, $password);
        
        // Generate filename
        $filename = $orderNumber ? "omniva-$orderNumber" : "omniva-order-$orderId";
        $pdfPath = "$pdfDir/$filename.pdf";
        
        // Download label and save to file
        $label->downloadLabels([$barcode], false, 'F', $filename);
        
        // Return public URL path
        $labelUrl = "/pdf_labels/$filename.pdf";
        shipmentLog("PDF label saved successfully", $labelUrl);
        return $labelUrl;
    } catch (Exception $e) {
        shipmentLog("Error saving PDF label", $e->getMessage());
        return null;
    }
}

// Function to update order with tracking details
function updateOrderWithTrackingDetails($orderId, $trackingUrl, $labelUrl) {
    shipmentLog("Updating order with tracking details", [
        'orderId' => $orderId, 
        'trackingUrl' => $trackingUrl, 
        'labelUrl' => $labelUrl
    ]);
    
    $updateData = [
        'tracking_url' => $trackingUrl,
        'label_url' => $labelUrl,
        'shipment_registered_at' => date('c') // ISO 8601 format
    ];
    
    $updateResult = supabaseRequest(
        "/rest/v1/orders?id=eq.$orderId",
        'PATCH',
        $updateData
    );
    
    $success = $updateResult['status'] === 204;
    shipmentLog("Order tracking update result", ['success' => $success, 'status' => $updateResult['status']]);
    return $success;
}

// Function to send notification email with tracking info
function sendAdminShipmentNotification($order, $barcode, $trackingUrl, $labelUrl) {
    shipmentLog("Sending admin shipment notification", [
        'orderNumber' => $order['order_number'],
        'barcode' => $barcode
    ]);
    
    try {
        // Load PHPMailer
        require_once __DIR__ . '/phpmailer/PHPMailer.php';
        require_once __DIR__ . '/phpmailer/SMTP.php';
        require_once __DIR__ . '/phpmailer/Exception.php';
        
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        
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
        $mail->addAddress('leen@leen.ee');
        $mail->addReplyTo('leen@leen.ee', 'Leen Väränen');
        
        // Content
        $mail->isHTML(true);
        $mail->Subject = "Omniva saadetis registreeritud - Tellimus #{$order['order_number']}";
        
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
                        <h1>Omniva saadetis registreeritud</h1>
                    </div>
                    <div class="content">
                        <p>Tellimuse <strong>#' . $order['order_number'] . '</strong> Omniva saadetis on edukalt registreeritud.</p>
                        
                        <div class="order-details">
                            <h3>Tellimuse info:</h3>
                            <p><strong>Tellimuse number:</strong> ' . $order['order_number'] . '</p>
                            <p><strong>Klient:</strong> ' . $order['customer_name'] . '</p>
                            <p><strong>E-post:</strong> ' . $order['customer_email'] . '</p>
                            <p><strong>Telefon:</strong> ' . $order['customer_phone'] . '</p>
                            <p><strong>Pakiautomaat:</strong> ' . $order['omniva_parcel_machine_name'] . '</p>
                        </div>
                        
                        <div class="tracking-info">
                            <h3>Saadetise info:</h3>
                            <p><strong>Jälgimiskood:</strong> ' . $barcode . '</p>
                            <p><a href="' . $trackingUrl . '" class="button">Jälgi saadetist</a></p>
                            <p><a href="' . $labelUrl . '" class="button">Lae alla saateleht</a></p>
                        </div>
                        
                        <p>Saateleht on automaatselt salvestatud ja lisatud tellimusele.</p>
                    </div>
                    <div class="footer">
                        <p>See on automaatne teavitus Leen.ee süsteemist.</p>
                    </div>
                </div>
            </body>
        </html>';
        
        $mail->Body = $emailBody;
        $mail->AltBody = strip_tags(str_replace(['<br>', '</p>'], ["\n", "\n\n"], $emailBody));
        
        $mail->send();
        shipmentLog("Admin shipment notification email sent successfully");
        return true;
    } catch (Exception $e) {
        shipmentLog("Failed to send admin shipment notification", $e->getMessage());
        return false;
    }
}

// Function to save PDF label
function savePdfLabel($barcode, $orderId, $orderNumber) {
    try {
        // Create PDF labels directory if it doesn't exist
        $pdfDir = __DIR__ . '/../../pdf_labels';
        if (!is_dir($pdfDir)) {
            mkdir($pdfDir, 0755, true);
        }
        
        // Initialize Omniva label class
        require_once __DIR__ . '/omniva/vendor/autoload.php';
        $label = new \Mijora\Omniva\Shipment\Label();
        
        // Get Omniva credentials
        $customerCode = '247723'; // Replace with your actual customer code
        $username = '247723';     // Replace with your actual username
        $password = 'Ddg(8?e:$A'; // Replace with your actual password
        
        $label->setAuth($username, $password);
        
        // Generate filename
        $filename = $orderNumber ? "omniva-$orderNumber" : "omniva-order-$orderId";
        $pdfPath = "$pdfDir/$filename.pdf";
        
        // Download label and save to file
        $result = $label->downloadLabels([$barcode], false, 'F', $filename, false);
        
        // If successful, update the order with the label URL
        if ($result !== false) {
            $labelUrl = "/pdf_labels/$filename.pdf";
            
            // Update order with label URL
            supabaseRequest(
                "/rest/v1/orders?id=eq.$orderId",
                'PATCH',
                [
                    'label_url' => $labelUrl
                ]
            );
            
            shipmentLog("PDF label saved successfully", $pdfPath);
            return $labelUrl;
        } else {
            shipmentLog("Failed to save PDF label", "Barcode: $barcode, Order: $orderId");
            return false;
        }
    } catch (Exception $e) {
        shipmentLog("Exception saving PDF label", $e->getMessage());
        return false;
    }
}

// Function to send notification email with tracking info
function sendTrackingNotification($orderId, $barcode, $labelUrl) {
    try {
        // Get order details
        $orderResult = supabaseRequest("/rest/v1/orders?id=eq.$orderId&select=*", 'GET');
        
        if ($orderResult['status'] !== 200 || empty($orderResult['data'])) {
            shipmentLog("Failed to get order details for notification", "Order ID: $orderId");
            return false;
        }
        
        $order = $orderResult['data'][0];
        
        // Get order items
        $itemsResult = supabaseRequest(
            "/rest/v1/order_items?order_id=eq.$orderId&select=*",
            'GET'
        );
        
        $items = ($itemsResult['status'] === 200) ? $itemsResult['data'] : [];
        
        // Prepare email content
        $trackingUrl = "https://www.omniva.ee/track?barcode=$barcode";
        $labelDownloadUrl = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . $labelUrl;
        
        // Load PHPMailer
        require_once __DIR__ . '/../vendor/phpmailer/phpmailer/src/Exception.php';
        require_once __DIR__ . '/../vendor/phpmailer/phpmailer/src/PHPMailer.php';
        require_once __DIR__ . '/../vendor/phpmailer/phpmailer/src/SMTP.php';
        
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        
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
        $mail->addAddress('leen@leen.ee');
        $mail->addReplyTo('leen@leen.ee', 'Leen.ee');
        
        // Content
        $mail->isHTML(true);
        $mail->Subject = "OMNIVA triipkood lisatud tellimusele #{$order['order_number']} – Leen.ee";
        
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
                        <h1>Omniva saadetis registreeritud</h1>
                    </div>
                    <div class="content">
                        <p>Tellimuse <strong>#' . $order['order_number'] . '</strong> Omniva saadetis on edukalt registreeritud.</p>
                        
                        <div class="order-details">
                            <h3>Tellimuse info:</h3>
                            <p><strong>Tellimuse number:</strong> ' . $order['order_number'] . '</p>
                            <p><strong>Klient:</strong> ' . $order['customer_name'] . '</p>
                            <p><strong>E-post:</strong> ' . $order['customer_email'] . '</p>
                            <p><strong>Telefon:</strong> ' . $order['customer_phone'] . '</p>
                            <p><strong>Pakiautomaat:</strong> ' . $order['omniva_parcel_machine_name'] . '</p>
                        </div>
                        
                        <div class="tracking-info">
                            <h3>Saadetise info:</h3>
                            <p><strong>Jälgimiskood:</strong> ' . $barcode . '</p>
                            <p><a href="' . $trackingUrl . '" target="_blank">Jälgi saadetist</a></p>
                            <p><a href="' . $labelDownloadUrl . '" target="_blank">Lae alla saateleht</a></p>
                        </div>
                        
                        <p>Tooted:</p>
                        <ul>';
        
        foreach ($items as $item) {
            $emailBody .= '<li>' . $item['product_title'] . ' - ' . $item['quantity'] . 'tk</li>';
        }
        
        $emailBody .= '
                        </ul>
                        
                        <p>Palun prindi saateleht välja ja kinnita pakile.</p>
                        
                        <div class="footer">
                            <p>See on automaatne teavitus Leen.ee süsteemist.</p>
                        </div>
                    </div>
                </div>
            </body>
        </html>';
        
        // Plain text alternative
        $textBody = "Omniva saadetis registreeritud\n\n" .
                   "Tellimuse #{$order['order_number']} Omniva saadetis on edukalt registreeritud.\n\n" .
                   "Tellimuse info:\n" .
                   "- Tellimuse number: {$order['order_number']}\n" .
                   "- Klient: {$order['customer_name']}\n" .
                   "- E-post: {$order['customer_email']}\n" .
                   "- Telefon: {$order['customer_phone']}\n" .
                   "- Pakiautomaat: {$order['omniva_parcel_machine_name']}\n\n" .
                   "Saadetise info:\n" .
                   "- Jälgimiskood: $barcode\n" .
                   "- Jälgi saadetist: $trackingUrl\n" .
                   "- Lae alla saateleht: $labelDownloadUrl\n\n" .
                   "Palun prindi saateleht välja ja kinnita pakile.\n\n" .
                   "See on automaatne teavitus Leen.ee süsteemist.";
        
        $mail->Body = $emailBody;
        $mail->AltBody = $textBody;
        
        $mail->send();
        shipmentLog("Tracking notification email sent successfully", "Order: {$order['order_number']}");
        return true;
    } catch (Exception $e) {
        shipmentLog("Failed to send tracking notification email", $e->getMessage());
        return false;
    }
}
// Main execution starts here
try {
    // Only accept POST requests
    shipmentLog("Received request", $_SERVER['REQUEST_METHOD']);
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit();
    }
    
    // Get the raw POST data
    $rawData = file_get_contents('php://input');
    shipmentLog("Received data (raw input)", $rawData);
    
    // Decode the JSON data
    $data = json_decode($rawData, true);
    
    // Check if JSON is valid
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
        exit();
    }
    
    // Validate required fields
    if (empty($data['orderId'])) {
        http_response_code(400);
        shipmentLog("Missing orderId in request");
        echo json_encode(['success' => false, 'error' => 'Order ID is required']);
        exit();
    }
    
    // Get order details
    $orderId = $data['orderId'];
    $order = getOrderDetails($orderId);
    shipmentLog("Order details retrieved", $order ? 'success' : 'failed');
    
    if (!$order) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Order not found']);
        exit();
    }
    
    // Check if this order has a parcel machine ID
    if (empty($order['omniva_parcel_machine_id'])) {
        shipmentLog("Not an Omniva parcel machine order", $order);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Not an Omniva parcel machine order']);
        exit();
    }
    
    // Check if shipment is already registered
    if (!empty($order['omniva_barcode'])) {
        shipmentLog("Shipment already registered", $order['omniva_barcode']);

        // Generate and save PDF label if requested
        if (isset($data['sendNotification']) && $data['sendNotification']) {
            $labelUrl = saveLabelPDF($order['omniva_barcode'], $order['order_number']);
            
            if ($labelUrl) {
                // Update order with label URL
                supabaseRequest(
                    "/rest/v1/orders?id=eq.$orderId",
                    'PATCH',
                    ['label_url' => $labelUrl]
                );
                
                // Send notification email
                sendAdminShipmentNotification(
                    $order, 
                    $order['omniva_barcode'], 
                    "https://www.omniva.ee/track?barcode={$order['omniva_barcode']}", 
                    $labelUrl
                );
            }
        }

        // Shipment already registered, return the existing barcode
        echo json_encode([
            'success' => true,
            'message' => 'Shipment already registered',
            'barcode' => $order['omniva_barcode']
        ]);
        exit();
    }
    
    // Omniva API credentials
    // Check if we have the required environment variables
    if (!getenv('OMNIVA_CUSTOMER_CODE') || !getenv('OMNIVA_USERNAME') || !getenv('OMNIVA_PASSWORD')) {
        // Try to load from .env file if it exists
        if (file_exists(__DIR__ . '/../../../.env')) {
            $envFile = file_get_contents(__DIR__ . '/../../../.env');
            
            preg_match('/OMNIVA_CUSTOMER_CODE=([^\n]+)/', $envFile, $customerCodeMatches);
            if (isset($customerCodeMatches[1])) {
                putenv('OMNIVA_CUSTOMER_CODE=' . $customerCodeMatches[1]);
            }
            
            preg_match('/OMNIVA_USERNAME=([^\n]+)/', $envFile, $usernameMatches);
            if (isset($usernameMatches[1])) {
                putenv('OMNIVA_USERNAME=' . $usernameMatches[1]);
            }
            
            preg_match('/OMNIVA_PASSWORD=([^\n]+)/', $envFile, $passwordMatches);
            if (isset($passwordMatches[1])) {
                putenv('OMNIVA_PASSWORD=' . $passwordMatches[1]);
            }
        }
        
        // If still not set, try alternate location
        if ((!getenv('OMNIVA_CUSTOMER_CODE') || !getenv('OMNIVA_USERNAME') || !getenv('OMNIVA_PASSWORD')) && 
            file_exists(__DIR__ . '/../../.env')) {
            $envFile = file_get_contents(__DIR__ . '/../../.env');
            
            preg_match('/OMNIVA_CUSTOMER_CODE=([^\n]+)/', $envFile, $customerCodeMatches);
            if (isset($customerCodeMatches[1])) {
                putenv('OMNIVA_CUSTOMER_CODE=' . $customerCodeMatches[1]);
            }
            
            preg_match('/OMNIVA_USERNAME=([^\n]+)/', $envFile, $usernameMatches);
            if (isset($usernameMatches[1])) {
                putenv('OMNIVA_USERNAME=' . $usernameMatches[1]);
            }
            
            preg_match('/OMNIVA_PASSWORD=([^\n]+)/', $envFile, $passwordMatches);
            if (isset($passwordMatches[1])) {
                putenv('OMNIVA_PASSWORD=' . $passwordMatches[1]);
            }
            
            shipmentLog("Loaded Omniva credentials from alternate location");
        }
    }
    
    $customerCode = getenv('OMNIVA_CUSTOMER_CODE') ?: '247723';
    $username = getenv('OMNIVA_USERNAME') ?: '247723';
    $password = getenv('OMNIVA_PASSWORD') ?: 'Ddg(8?e:$A';
    
    shipmentLog("Omniva API credentials used", ['customerCode' => $customerCode, 'username' => $username]);
    
    // Calculate package measurements based on order items
    $totalWeight = 0;
    $maxLength = 0;
    $maxWidth = 0;
    $maxHeight = 0;
    
    foreach ($order['items'] as $item) {
        // Add item weight if available, otherwise estimate
        $itemWeight = 0;
        
        if (isset($item['products']) && isset($item['products']['weight']) && $item['products']['weight'] > 0) {
            $itemWeight = $item['products']['weight'];
        } else {
            // Estimate weight based on product type or use a default
            $itemWeight = 0.5; // Default 500g per item
        }
        
        $totalWeight += $itemWeight * ($item['quantity'] ?? 1);
        
        // Process dimensions if available
        if (isset($item['products']) && isset($item['products']['dimensions']) && is_array($item['products']['dimensions'])) {
            $dimensions = $item['products']['dimensions'];
            
            // Extract dimensions, ensuring they are numeric
            $length = isset($dimensions['width2']) && is_numeric($dimensions['width2']) ? (float)$dimensions['width2'] : 0;
            $width = isset($dimensions['width']) && is_numeric($dimensions['width']) ? (float)$dimensions['width'] : 0;
            $height = isset($dimensions['height']) && is_numeric($dimensions['height']) ? (float)$dimensions['height'] : 0;
            
            // Update maximum dimensions
            $maxLength = max($maxLength, $length);
            $maxWidth = max($maxWidth, $width);
            $maxHeight = max($maxHeight, $height);
        }
    }
    
    shipmentLog("Calculated package measurements", [
        'totalWeight' => $totalWeight,
        'maxLength' => $maxLength,
        'maxWidth' => $maxWidth,
        'maxHeight' => $maxHeight
    ]);
    
    // Ensure we have reasonable values
    if ($totalWeight < 0.1) $totalWeight = 1.0; // Default to 1kg
    if ($maxLength < 0.1) $maxLength = 0.3;     // Default to 30cm
    if ($maxWidth < 0.1) $maxWidth = 0.3;       // Default to 30cm
    if ($maxHeight < 0.1) $maxHeight = 0.3;     // Default to 30cm
    
    // Convert cm to meters for Omniva API
    $lengthM = $maxLength / 100;
    $widthM = $maxWidth / 100;
    $heightM = $maxHeight / 100;
    
    try {
        // Initialize Omniva shipment
        shipmentLog("Initializing Omniva shipment object");
        $shipment = new Shipment();
        $shipment->setComment("Order #{$order['order_number']}");
        
        // Set shipment header
        $shipmentHeader = new ShipmentHeader();
        $shipmentHeader
            ->setSenderCd($customerCode)
            ->setFileId(date('YmdHis'));
        $shipment->setShipmentHeader($shipmentHeader);
        
        // Create package
        $package = new Package();
        $package
            ->setId($order['order_number'])
            ->setService('PU'); // PU = Parcel machine service
        
        // Set package measurements
        $measures = new Measures();
        $measures
            ->setWeight($totalWeight)
            ->setLength($lengthM)
            ->setWidth($widthM)
            ->setHeight($heightM);
        $package->setMeasures($measures);
        
        // Set receiver contact info
        shipmentLog("Setting receiver contact", [
            'name' => $order['customer_name'],
            'email' => $order['customer_email'],
            'phone' => $order['customer_phone'],
            'parcelMachineId' => $order['omniva_parcel_machine_id']
        ]);
        
        $receiverContact = new Contact();
        $receiverAddress = new Address();
        $receiverAddress
            ->setCountry('EE') // Hardcoded to Estonia for now
            ->setOffloadPostcode($order['omniva_parcel_machine_id']);
        
        $receiverContact
            ->setAddress($receiverAddress)
            ->setMobile($order['customer_phone'])
            ->setEmail($order['customer_email'])
            ->setPersonName($order['customer_name']);
        
        $package->setReceiverContact($receiverContact);
        
        // Set sender contact info
        shipmentLog("Setting sender contact");
        $senderContact = new Contact();
        $senderAddress = new Address();
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
        $shipment->setAuth($username, $password);
        
        // Register shipment
        shipmentLog("Registering shipment with Omniva", [
            'order_id' => $orderId,
            'order_number' => $order['order_number'],
            'parcel_machine_id' => $order['omniva_parcel_machine_id']
        ]);
        
        shipmentLog("Calling shipment->registerShipment()");
        $result = $shipment->registerShipment();
        shipmentLog("Shipment registration result", $result);
        
        if (isset($result['barcodes']) && !empty($result['barcodes'])) {
            try {
                $barcode = $result['barcodes'][0];

                $updateResult = updateOrderWithOmnivaDetails($orderId, $barcode);
                shipmentLog("Order updated with barcode", ['success' => $updateResult, 'barcode' => $barcode]);
                
                // Generate and save PDF label
                $labelUrl = saveLabelPDF($barcode, $order['order_number']);
                
                // Create tracking URL
                $trackingUrl = "https://www.omniva.ee/track?barcode=$barcode";
                
                // Update order with tracking URL and label URL
                if ($labelUrl) {
                    updateOrderWithTrackingDetails($orderId, $trackingUrl, $labelUrl);
                }
                
                // Send notification email if requested
                if (isset($data['sendNotification']) && $data['sendNotification'] && $labelUrl) {
                    sendAdminShipmentNotification($order, $barcode, $trackingUrl, $labelUrl);
                }
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Shipment registered successfully',
                    'barcode' => $barcode, 
                    'tracking_url' => "https://www.omniva.ee/track?barcode=$barcode",
                    'label_url' => $labelUrl
                ]);
            } catch (Exception $e) {
                shipmentLog("Error processing shipment after registration: " . $e->getMessage());
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Error processing shipment: ' . $e->getMessage()
                ]);
            }
        } else {
            shipmentLog("No barcode received from Omniva API", $result);
            throw new Exception('Omniva API ei tagastanud triipkoodi');
        }
    } catch (OmnivaException $e) {
        shipmentLog("Omniva Exception", $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Omniva API error: ' . $e->getMessage()
        ]);
    }
} catch (Exception $e) {
    shipmentLog("Exception", $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Save label PDF to file system
 * 
 * @param string $barcode Omniva barcode
 * @param string $orderNumber Order number for filename
 * @return string Path to saved PDF file
 */
function saveLabelPDF($barcode, $orderNumber) {
    try {
        // Initialize Omniva label class
        $label = new \Mijora\Omniva\Shipment\Label();
        shipmentLog("Generating PDF label for barcode", $barcode);
        
        // Omniva API credentials
        $customerCode = '247723';
        $username = '247723';
        $password = 'Ddg(8?e:$A';
        
        $label->setAuth($username, $password);
        
        // Create directory if it doesn't exist
        $pdfDir = __DIR__ . '/../pdf_labels';
        if (!is_dir($pdfDir)) {
            mkdir($pdfDir, 0755, true);
            shipmentLog("Created PDF directory", $pdfDir);
        }
        shipmentLog("PDF directory path", $pdfDir);
        
        // Generate filename
        $filename = 'omniva_' . preg_replace('/[^a-zA-Z0-9]/', '_', $orderNumber) . '_' . $barcode;
        $filePath = $pdfDir . '/' . $filename . '.pdf';
        
        shipmentLog("Attempting to download label to", $filePath);
        // Download label and save to file
        $label->downloadLabels([$barcode], false, 'F', $filename, false);
        
        // Return public URL path
        return '/pdf_labels/' . $filename . '.pdf';
    } catch (Exception $e) {
        logMessage("Error saving label PDF: " . $e->getMessage());
        shipmentLog("Error saving PDF label", $e->getMessage());
        return null;
    }
}

/**
 * Update order with tracking details
 * 
 * @param string $orderId Order ID
 * @param string $trackingUrl Tracking URL
 * @param string $labelUrl Label URL
 * @return bool Success status
 */
function updateOrderWithTrackingDetails($orderId, $trackingUrl, $labelUrl) {
    try {
        $updateData = [
           'tracking_url' => $trackingUrl,
           'label_url' => $labelUrl,
           'shipment_registered_at' => date('Y-m-d H:i:s')
        ];
        shipmentLog("Updating order with tracking details", ['orderId' => $orderId, 'trackingUrl' => $trackingUrl, 'labelUrl' => $labelUrl]);
        
        $result = supabaseRequest(
            "/rest/v1/orders?id=eq.$orderId",
            'PATCH',
            $updateData
        );
        
        return $result['status'] === 204;
    } catch (Exception $e) {
        logMessage("Error updating order with tracking details: " . $e->getMessage());
        return false;
    }
}

/**
 * Send notification email to admin with shipment details
 * 
 * @param array $order Order data
 * @param string $barcode Omniva barcode
 * @param string $trackingUrl Tracking URL
 * @param string $labelUrl Label URL
 * @return bool Success status
 */
function sendAdminShipmentNotification($order, $barcode, $trackingUrl, $labelUrl) {
    try {
        shipmentLog("Sending admin shipment notification", ['orderNumber' => $order['order_number'], 'barcode' => $barcode]);

        // Prepare email content
        $serverName = $_SERVER['SERVER_NAME'] ?? 'leen.ee';
        $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https://" : "http://") . $serverName;
        
        $subject = "OMNIVA triipkood lisatud tellimusele #{$order['order_number']} – Leen.ee";
        
        $emailMessage = '
            <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; }
                        .header { background-color: #2f3e9c; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; }
                        .info-box { background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }
                        .button { display: inline-block; background-color: #2f3e9c; color: white; padding: 10px 20px; 
                                 text-decoration: none; border-radius: 5px; margin-top: 15px; }
                        .footer { font-size: 12px; color: #777; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Omniva saadetise info</h2>
                        </div>
                        <div class="content">
                            <p>Omniva saadetis on registreeritud järgmisele tellimusele:</p>
                            
                            <div class="info-box">
                                <p><strong>Tellimuse number:</strong> ' . $order['order_number'] . '</p>
                                <p><strong>Klient:</strong> ' . $order['customer_name'] . '</p>
                                <p><strong>E-post:</strong> ' . $order['customer_email'] . '</p>
                                <p><strong>Telefon:</strong> ' . $order['customer_phone'] . '</p>
                                <p><strong>Pakiautomaat:</strong> ' . $order['omniva_parcel_machine_name'] . '</p>
                                <p><strong>Triipkood:</strong> ' . $barcode . '</p>
                            </div>
                            
                            <p>Saadetise jälgimiseks ja saatelehe printimiseks:</p>
                            
                            <p><a href="' . $trackingUrl . '" class="button" target="_blank">Jälgi saadetist</a></p>
                            
                            <p><a href="' . $baseUrl . $labelUrl . '" class="button" target="_blank">Prindi saateleht</a></p>
                            
                            <p>Saate saadetise andmeid vaadata ka administreerimisliideses:</p>
                            
                            <p><a href="' . $baseUrl . '/admin/orders" class="button">Vaata tellimusi</a></p>
                        </div>
                        <div class="footer">
                            <p>See on automaatne teavitus Leen.ee e-poest.</p>
                        </div>
                    </div>
                </body>
            </html>
        ';

        // Send email using PHPMailer
        require_once __DIR__ . '/phpmailer/PHPMailer.php';
        require_once __DIR__ . '/phpmailer/SMTP.php';
        require_once __DIR__ . '/phpmailer/Exception.php';
        
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        
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
        $mail->addAddress('leen@leen.ee');
        $mail->addReplyTo('leen@leen.ee');
        
        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $emailMessage;
        $mail->AltBody = strip_tags(str_replace(['<br>', '</p>'], ["\n", "\n\n"], $emailMessage));
        
        $mail->send();
        logMessage("Admin shipment notification email sent successfully");
        return true;
    } catch (Exception $e) {
        logMessage("Error sending admin shipment notification: " . $e->getMessage());
        return false;
    }
}