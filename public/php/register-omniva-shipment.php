<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them

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

// Function to get order details by ID
function getOrderDetails($orderId) {
    $orderResult = supabaseRequest("/rest/v1/orders?id=eq.$orderId", 'GET');
    
    if ($orderResult['status'] !== 200 || empty($orderResult['data'])) {
        return null;
    }
    
    $order = $orderResult['data'][0];
    
    // Get order items
    $itemsResult = supabaseRequest(
        "/rest/v1/order_items?order_id=eq.$orderId&select=*,products(weight,dimensions)",
        'GET'
    );
    
    if ($itemsResult['status'] === 200) {
        $order['items'] = $itemsResult['data'];
    } else {
        $order['items'] = [];
    }
    
    return $order;
}

// Function to update order with Omniva shipment details
function updateOrderWithOmnivaDetails($orderId, $barcode) {
    $updateResult = supabaseRequest(
        "/rest/v1/orders?id=eq.$orderId",
        'PATCH',
        [
            'omniva_barcode' => $barcode
        ]
    );
    
    return $updateResult['status'] === 204;
}

// Main execution starts here
try {
    // Only accept POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit();
    }
    
    // Get the raw POST data
    $rawData = file_get_contents('php://input');
    logMessage("Received data", $rawData);
    
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
        echo json_encode(['success' => false, 'error' => 'Order ID is required']);
        exit();
    }
    
    // Get order details
    $orderId = $data['orderId'];
    $order = getOrderDetails($orderId);
    
    if (!$order) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Order not found']);
        exit();
    }
    
    // Check if this order has a parcel machine ID
    if (empty($order['omniva_parcel_machine_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Not an Omniva parcel machine order']);
        exit();
    }
    
    // Check if shipment is already registered
    if (!empty($order['omniva_barcode'])) {
        // Shipment already registered, return the existing barcode
        echo json_encode([
            'success' => true,
            'message' => 'Shipment already registered',
            'barcode' => $order['omniva_barcode']
        ]);
        exit();
    }
    
    // Omniva API credentials
    $customerCode = '247723'; // Replace with your actual customer code
    $username = '247723';     // Replace with your actual username
    $password = 'Ddg(8?e:$A'; // Replace with your actual password
    
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
        logMessage("Registering shipment with Omniva", [
            'order_id' => $orderId,
            'order_number' => $order['order_number'],
            'parcel_machine_id' => $order['omniva_parcel_machine_id']
        ]);
        
        $result = $shipment->registerShipment();
        
        if (isset($result['barcodes']) && !empty($result['barcodes'])) {
            $barcode = $result['barcodes'][0];
            
            // Update order with barcode
            updateOrderWithOmnivaDetails($orderId, $barcode);
            
            echo json_encode([
                'success' => true,
                'message' => 'Shipment registered successfully',
                'barcode' => $barcode
            ]);
        } else {
            throw new Exception('No barcode received from Omniva API');
        }
    } catch (OmnivaException $e) {
        logMessage("Omniva Exception", $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Omniva API error: ' . $e->getMessage()
        ]);
    }
} catch (Exception $e) {
    logMessage("Exception", $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}