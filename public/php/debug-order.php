<?php
// This is a debug script to test the order retrieval flow
// It fetches an order by order number and displays the result

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load environment variables
require_once __DIR__ . '/env-loader.php';

// Set up logging
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}
$logFile = $logDir . '/debug_order.log';

// Function to log messages
function debugLog($message, $data = null) {
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
        debugLog("cURL Error", $error);
        return ['error' => $error, 'status' => $statusCode];
    }
    
    return [
        'data' => json_decode($response, true),
        'status' => $statusCode
    ];
}

// Get order number from query parameter
$orderNumber = $_GET['order_number'] ?? null;
$reference = $_GET['reference'] ?? null;

// Check if we have the required environment variables
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
            debugLog("Loaded SUPABASE_SERVICE_ROLE_KEY from alternate location");
        }
    }
    
    // If still not set, show an error
    if (!getenv('SUPABASE_SERVICE_ROLE_KEY')) {
        echo "<h1>Configuration Error</h1>";
        echo "<p>SUPABASE_SERVICE_ROLE_KEY environment variable not set</p>";
        exit;
    }
}

if (!$orderNumber && !$reference) {
    echo "<h1>Debug Order Retrieval</h1>";
    echo "<p>Please provide an order_number or reference parameter.</p>";
    echo "<form>";
    echo "<label>Order Number: <input type='text' name='order_number'></label>";
    echo "<button type='submit'>Fetch Order</button>";
    echo "</form>";
    echo "<form>";
    echo "<label>Reference: <input type='text' name='reference'></label>";
    echo "<button type='submit'>Fetch Order by Reference</button>";
    echo "</form>";
    exit;
}

// Fetch order by order number or reference
if ($orderNumber) {
    debugLog("Fetching order by order number", $orderNumber);
    $orderResult = supabaseRequest(
        "/rest/v1/orders?order_number=eq.$orderNumber&select=*,omniva_parcel_machine_id,omniva_parcel_machine_name,omniva_barcode,tracking_url,label_url,shipment_registered_at,reference",
        'GET'
    );
} else {
    debugLog("Fetching order by reference", $reference);
    $orderResult = supabaseRequest(
        "/rest/v1/orders?reference=eq.$reference&select=*,omniva_parcel_machine_id,omniva_parcel_machine_name,omniva_barcode,tracking_url,label_url,shipment_registered_at",
        'GET'
    );
}

// Check if order exists
if ($orderResult['status'] !== 200 || empty($orderResult['data'])) {
    debugLog("Order not found", ['orderNumber' => $orderNumber, 'reference' => $reference, 'status' => $orderResult['status']]);
    echo "<h1>Order Not Found</h1>";
    echo "<p>No order found with " . ($orderNumber ? "order number: $orderNumber" : "reference: $reference") . "</p>";
    exit;
}

$order = $orderResult['data'][0];
$orderId = $order['id'];

// Get order items
debugLog("Fetching order items", $orderId);
$itemsResult = supabaseRequest(
    "/rest/v1/order_items?order_id=eq.$orderId&select=*",
    'GET'
);

if ($itemsResult['status'] === 200) {
    $order['items'] = $itemsResult['data'];
} else {
    $order['items'] = [];
}

// Get payment info
debugLog("Fetching payment info", $orderId);
$paymentsResult = supabaseRequest(
    "/rest/v1/order_payments?order_id=eq.$orderId&select=*",
    'GET'
);

if ($paymentsResult['status'] === 200) {
    $order['payments'] = $paymentsResult['data'];
} else {
    $order['payments'] = [];
}

// Output results
echo "<h1>Order Details</h1>";
echo "<h2>Basic Info</h2>";
echo "<table border='1' cellpadding='5' cellspacing='0'>";
echo "<tr><th>Field</th><th>Value</th></tr>";
foreach ($order as $key => $value) {
    if ($key !== 'items' && $key !== 'payments') {
        echo "<tr><td>$key</td><td>";
        if (is_array($value)) {
            echo "<pre>" . json_encode($value, JSON_PRETTY_PRINT) . "</pre>";
        } else {
            echo htmlspecialchars($value);
        }
        echo "</td></tr>";
    }
}
echo "</table>";

// Output items
if (!empty($order['items'])) {
    echo "<h2>Order Items</h2>";
    echo "<table border='1' cellpadding='5' cellspacing='0'>";
    echo "<tr><th>ID</th><th>Product ID</th><th>Title</th><th>Quantity</th><th>Price</th></tr>";
    foreach ($order['items'] as $item) {
        echo "<tr>";
        echo "<td>" . htmlspecialchars($item['id']) . "</td>";
        echo "<td>" . htmlspecialchars($item['product_id']) . "</td>";
        echo "<td>" . htmlspecialchars($item['product_title']) . "</td>";
        echo "<td>" . htmlspecialchars($item['quantity']) . "</td>";
        echo "<td>" . htmlspecialchars($item['price']) . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<h2>No Order Items Found</h2>";
}

// Output payments
if (!empty($order['payments'])) {
    echo "<h2>Payments</h2>";
    echo "<table border='1' cellpadding='5' cellspacing='0'>";
    echo "<tr><th>ID</th><th>Transaction ID</th><th>Method</th><th>Amount</th><th>Status</th><th>Created At</th></tr>";
    foreach ($order['payments'] as $payment) {
        echo "<tr>";
        echo "<td>" . htmlspecialchars($payment['id']) . "</td>";
        echo "<td>" . htmlspecialchars($payment['transaction_id']) . "</td>";
        echo "<td>" . htmlspecialchars($payment['payment_method']) . "</td>";
        echo "<td>" . htmlspecialchars($payment['amount']) . " " . htmlspecialchars($payment['currency']) . "</td>";
        echo "<td>" . htmlspecialchars($payment['status']) . "</td>";
        echo "<td>" . htmlspecialchars($payment['created_at']) . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<h2>No Payments Found</h2>";
}

// Omniva shipment info
if (!empty($order['omniva_barcode'])) {
    echo "<h2>Omniva Shipment</h2>";
    echo "<table border='1' cellpadding='5' cellspacing='0'>";
    echo "<tr><th>Field</th><th>Value</th></tr>";
    echo "<tr><td>Barcode</td><td>" . htmlspecialchars($order['omniva_barcode']) . "</td></tr>";
    echo "<tr><td>Parcel Machine</td><td>" . htmlspecialchars($order['omniva_parcel_machine_name']) . "</td></tr>";
    
    if (!empty($order['tracking_url'])) {
        echo "<tr><td>Tracking URL</td><td><a href='" . htmlspecialchars($order['tracking_url']) . "' target='_blank'>" . htmlspecialchars($order['tracking_url']) . "</a></td></tr>";
    }
    
    if (!empty($order['label_url'])) {
        echo "<tr><td>Label URL</td><td><a href='" . htmlspecialchars($order['label_url']) . "' target='_blank'>" . htmlspecialchars($order['label_url']) . "</a></td></tr>";
    }
    
    if (!empty($order['shipment_registered_at'])) {
        echo "<tr><td>Registered At</td><td>" . htmlspecialchars($order['shipment_registered_at']) . "</td></tr>";
    }
    
    echo "</table>";
} else {
    echo "<h2>No Omniva Shipment Registered</h2>";
}

// Debug info
echo "<h2>Debug Info</h2>";
echo "<p>Log file: $logFile</p>";
echo "<p>Query time: " . date('Y-m-d H:i:s') . "</p>";