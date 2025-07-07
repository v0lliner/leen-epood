<?php
// Set error reporting but don't display errors to users
// Set error reporting but don't display errors to users
// NOTE: SECURITY CONSIDERATION - In a production environment, these credentials should be loaded
// from secure environment variables or a database, rather than being hardcoded in the source code.
// This is especially important for API credentials that provide access to shipping services.

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/omniva_error.log');
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/omniva_error.log');

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

// Log file for debugging
$logFile = __DIR__ . '/omniva_shipment_log.txt';

// Create log file if it doesn't exist with proper permissions
if (!file_exists($logFile)) {
    touch($logFile);
    chmod($logFile, 0666); // Make writable by the web server
}

// Create log file if it doesn't exist with proper permissions
if (!file_exists($logFile)) {
    touch($logFile);
    chmod($logFile, 0666); // Make writable by the web server
}

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
    // Load API key from environment variable if available, otherwise use hardcoded key
    // Load API key from environment variable if available, otherwise use hardcoded key
    // For zone.ee, you can set this in .htaccess or php.ini
    $supabaseKey = getenv('SUPABASE_SERVICE_KEY') ?: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY2VucGlyamtma2dkZ3hrdHJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExMzgwNCwiZXhwIjoyMDY2Njg5ODA0fQ.VQgOh4VmI0hmyXawVt0-uOmMFgHXkqhkMFQxBLjjQME';
    
    // For zone.ee, you can set this in .htaccess or php.ini
    $supabaseKey = getenv('SUPABASE_SERVICE_KEY') ?: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY2VucGlyamtma2dkZ3hrdHJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExMzgwNCwiZXhwIjoyMDY2Njg5ODA0fQ.VQgOh4VmI0hmyXawVt0-uOmMFgHXkqhkMFQxBLjjQME';
    
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
    
    // Log the request details for debugging
    logMessage("Omniva API request", [
        'url' => 'https://omx.omniva.eu/api/v01/omx/shipments/business-to-client',
        'httpCode' => $httpCode,
        'error' => $error ? $error : 'none'
    ]);
    
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
    $orderResult = supabaseRequest(
        "/rest/v1/orders?id=eq.$orderId&select=*",
        'GET'
    );
    
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
function updateOrderWithOmnivaDetails($orderId, $barcode, $status) {
    $updateResult = supabaseRequest(
        "/rest/v1/orders?id=eq.$orderId",
        'PATCH',
        [
            'omniva_barcode' => $barcode,
            'omniva_shipment_status' => $status
        ]
    );
    
    return $updateResult['status'] === 204;
}

// Function to register shipment with Omniva
function registerOmnivaShipment($order) {
    // Omniva API credentials
    // Load from environment variables if available, otherwise use hardcoded values
    $customerCode = getenv('OMNIVA_CUSTOMER_CODE') ?: '247723';
    $username = getenv('OMNIVA_USERNAME') ?: '247723';
    $password = getenv('OMNIVA_PASSWORD') ?: 'Ddg(8?e:$A';
    $password = getenv('OMNIVA_PASSWORD') ?: 'Ddg(8?e:$A';
    
    // Generate a unique file ID
    $fileId = uniqid('leen_', true);
    
    // Calculate package measurements based on order items
    $packageMeasurements = calculatePackageMeasurements($order['items']);
    
    // Prepare receiver address
    $receiverName = $order['customer_name'];
    $receiverPhone = $order['customer_phone'];
    $receiverEmail = $order['customer_email'];
    $parcelMachineId = $order['omniva_parcel_machine_id'];
    
    // Prepare sender address (your business details)
    $senderName = 'Leen Väränen';
    $senderCompany = 'PopLeen OÜ';
    $senderAddress = 'Jõeääre, Märjamaa';
    $senderPostcode = '79631';
    $senderCity = 'Rapla maakond';
    $senderCountry = 'EE';
    $senderPhone = '+37253801413';
    $senderEmail = 'leen@leen.ee';
    
    // Construct the request payload
    $payload = [
        'customerCode' => $customerCode,
        'fileId' => $fileId,
        'shipments' => [
            [
                'mainService' => 'PARCEL',
                'deliveryChannel' => 'PARCEL_MACHINE',
                'servicePackage' => 'STANDARD',
                'receiverAddressee' => [
                    'personName' => $receiverName,
                    'contactMobile' => $receiverPhone,
                    'contactEmail' => $receiverEmail,
                    'address' => [
                        'country' => 'EE', // Hardcoded to Estonia for now
                        'offloadPostcode' => $parcelMachineId
                    ]
                ],
                'senderAddressee' => [
                    'personName' => $senderName,
                    'companyName' => $senderCompany,
                    'contactMobile' => $senderPhone,
                    'contactEmail' => $senderEmail,
                    'address' => [
                        'street' => $senderAddress,
                        'postcode' => $senderPostcode,
                        'city' => $senderCity,
                        'country' => $senderCountry
                    ]
                ],
                'measurement' => $packageMeasurements,
                'notifications' => [
                    [
                        'channel' => 'EMAIL',
                        'recipient' => $receiverEmail,
                        'eventCode' => 'REGISTERED'
                    ],
                    [
                        'channel' => 'SMS',
                        'recipient' => $receiverPhone,
                        'eventCode' => 'ARRIVED_PARCEL_MACHINE'
                    ]
                ]
            ]
        ]
    ];
    
    logMessage("Registering Omniva shipment with payload", $payload);
    
    // Make the API request to Omniva
    $ch = curl_init('https://omx.omniva.eu/api/v01/omx/shipments/business-to-client');
    
    // Set a reasonable timeout
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    
    // Set a reasonable timeout
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_USERPWD, "$username:$password");
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    // Log the request details for debugging
    logMessage("Omniva API request", [
        'url' => 'https://omx.omniva.eu/api/v01/omx/shipments/business-to-client',
        'httpCode' => $httpCode,
        'error' => $error ? $error : 'none'
    ]);
    
    curl_close($ch);
    
    if ($error) {
        logMessage("cURL Error", $error);
        return ['success' => false, 'error' => $error];
    }
    
    $responseData = json_decode($response, true);
    logMessage("Omniva API response", ['httpCode' => $httpCode, 'response' => $responseData]);
    
    if ($httpCode >= 200 && $httpCode < 300 && isset($responseData['savedShipments']) && !empty($responseData['savedShipments'])) {
        // Extract barcode from the response
        $barcode = $responseData['savedShipments'][0]['barcode'] ?? null;
        
        if ($barcode) {
            return ['success' => true, 'barcode' => $barcode];
        }
    }
    
    return ['success' => false, 'error' => 'Failed to register shipment with Omniva', 'response' => $responseData];
}

// Function to calculate package measurements based on order items
function calculatePackageMeasurements($items) {
    // This function correctly utilizes the weight and dimensions data from the products table
    // which is crucial for accurate Omniva shipment registration.
    // It extracts weight from product.weight and dimensions from product.dimensions (JSON field)
    
    // Default measurements if no items or no dimensions available
    $defaultMeasurements = [
        'weight' => 1.0, // 1 kg
        'length' => 0.3, // 30 cm
        'width' => 0.3,  // 30 cm
        'height' => 0.3  // 30 cm
    ];
    
    if (empty($items)) {
        return $defaultMeasurements;
    }
    
    // Initialize with minimum values
    $totalWeight = 0;
    $maxLength = 0;
    $maxWidth = 0;
    $totalHeight = 0;
    
    foreach ($items as $item) {
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
            $totalHeight += $height;
        }
    }
    
    // Ensure we have reasonable values
    if ($totalWeight < 0.1) $totalWeight = $defaultMeasurements['weight'];
    if ($maxLength < 0.1) $maxLength = $defaultMeasurements['length'];
    if ($maxWidth < 0.1) $maxWidth = $defaultMeasurements['width'];
    if ($totalHeight < 0.1) $totalHeight = $defaultMeasurements['height'];
    
    // Convert to meters for Omniva API
    return [
        'weight' => $totalWeight,
        'length' => $maxLength / 100, // Convert cm to m
        'width' => $maxWidth / 100,   // Convert cm to m
        'height' => $totalHeight / 100 // Convert cm to m
    ];
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
    
    // Check if this is an Omniva parcel machine order
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
            'barcode' => $order['omniva_barcode'],
            'status' => $order['omniva_shipment_status']
        ]);
        exit();
    }
    
    // Register shipment with Omniva
    $registrationResult = registerOmnivaShipment($order);
    
    if ($registrationResult['success']) {
        // Update order with barcode and status
        $updateResult = updateOrderWithOmnivaDetails($orderId, $registrationResult['barcode'], 'REGISTERED');
        
        if ($updateResult) {
            echo json_encode([
                'success' => true,
                'message' => 'Shipment registered successfully',
                'barcode' => $registrationResult['barcode']
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'message' => 'Shipment registered but failed to update order',
                'barcode' => $registrationResult['barcode']
            ]);
        }
    } else {
        // Update order with failed status
        updateOrderWithOmnivaDetails($orderId, null, 'FAILED');
        
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $registrationResult['error'],
            'details' => $registrationResult['response'] ?? null
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