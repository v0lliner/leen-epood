<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set content type to JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Log file for debugging
$logDir = __DIR__ . '/../../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}
$logFile = $logDir . '/admin_orders.log';

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

// Get order details by ID
function getOrderDetails($orderId) {
    // Get order basic info
    $orderResult = supabaseRequest(
        "/rest/v1/orders?id=eq.$orderId&select=*,omniva_parcel_machine_id,omniva_parcel_machine_name,omniva_barcode,tracking_url,label_url,shipment_registered_at",
        'GET'
    );
    
    if ($orderResult['status'] !== 200 || empty($orderResult['data'])) {
        return null;
    }
    
    $order = $orderResult['data'][0];
    
    // Get order items
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
    $paymentsResult = supabaseRequest(
        "/rest/v1/order_payments?order_id=eq.$orderId&select=*",
        'GET'
    );
    
    if ($paymentsResult['status'] === 200) {
        $order['payments'] = $paymentsResult['data'];
    } else {
        $order['payments'] = [];
    }
    
    return $order;
}

// Function to get order details by order number
function getOrderDetailsByOrderNumber($orderNumber) {
    // Get order basic info
    logMessage("Fetching order details for order number", $orderNumber);
    $orderResult = supabaseRequest(
        "/rest/v1/orders?order_number=eq.$orderNumber&select=*,omniva_parcel_machine_id,omniva_parcel_machine_name,omniva_barcode,tracking_url,label_url,shipment_registered_at,reference",
        'GET'
    );
    
    if ($orderResult['status'] !== 200 || empty($orderResult['data'])) {
        logMessage("Order not found for order number", $orderNumber);
        return null;
    }
    
    $order = $orderResult['data'][0];
    $orderId = $order['id'];
    
    // Get order items
    logMessage("Fetching order items for order", $orderId);
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
    logMessage("Fetching payment info for order", $orderId);
    $paymentsResult = supabaseRequest(
        "/rest/v1/order_payments?order_id=eq.$orderId&select=*",
        'GET'
    );
    
    if ($paymentsResult['status'] === 200) {
        $order['payments'] = $paymentsResult['data'];
    } else {
        $order['payments'] = [];
    }
    
    return $order;
}

// Update order status
function updateOrderStatus($orderId, $newStatus) {
    $updateResult = supabaseRequest(
        "/rest/v1/orders?id=eq.$orderId",
        'PATCH',
        ['status' => $newStatus]
    );
    
    return $updateResult['status'] === 204;
}

// Main execution starts here
try {
    logMessage("Received request", ['method' => $_SERVER['REQUEST_METHOD'], 'uri' => $_SERVER['REQUEST_URI'], 'get' => $_GET]);
    
    // Parse the URL to get the order ID if present
    $requestUri = $_SERVER['REQUEST_URI'];
    $orderId = null;
    $orderNumber = null; 
    $referenceParam = null;
    $action = null;
    
    // Extract order ID and action from URL
    if (preg_match('/\/orders\/([^\/]+)(?:\/([^\/]+))?/', $requestUri, $matches)) {
        $orderId = $matches[1];
        $action = $matches[2] ?? null;
    }
    
    // Check if order_number is provided in query string
    if (isset($_GET['order_number'])) {
        $orderNumber = $_GET['order_number'];
    }

    // Check if reference is provided in query string
    if (isset($_GET['reference'])) {
        $referenceParam = $_GET['reference'];
    }
    
    // Handle different request types
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // If order ID is provided, get specific order details
        if ($orderId) {
            logMessage("Fetching order details for ID", $orderId);
            $order = getOrderDetails($orderId);
            
            if ($order) {
                echo json_encode([
                    'success' => true,
                    'order' => $order
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Order not found'
                ]);
            }
        } 
        // If order number is provided, get order details by order number
        else if ($orderNumber) {
            $order = getOrderDetailsByOrderNumber($orderNumber);
            
            if ($order) {
                echo json_encode([
                    'success' => true,
                    'order' => $order
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Order not found'
                ]);
            }
        } 
        // If reference is provided, get order details by reference
        else if ($referenceParam) {
            logMessage("Fetching order details for reference", $referenceParam);
            
            // Get order basic info
            $orderResult = supabaseRequest(
                "/rest/v1/orders?reference=eq.$referenceParam&select=*,omniva_parcel_machine_id,omniva_parcel_machine_name,omniva_barcode,tracking_url,label_url,shipment_registered_at",
                'GET'
            );
            
            if ($orderResult['status'] !== 200 || empty($orderResult['data'])) {
                logMessage("Order not found for reference", $referenceParam);
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Order not found'
                ]);
                exit();
            }
            
            $order = $orderResult['data'][0];
            $orderId = $order['id'];
            
            // Get order items
            logMessage("Fetching order items for order", $orderId);
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
            logMessage("Fetching payment info for order", $orderId);
            $paymentsResult = supabaseRequest(
                "/rest/v1/order_payments?order_id=eq.$orderId&select=*",
                'GET'
            );
            
            if ($paymentsResult['status'] === 200) {
                $order['payments'] = $paymentsResult['data'];
            } else {
                $order['payments'] = [];
            }
            
            echo json_encode([
                'success' => true,
                'order' => $order
            ]);
        }
        // Otherwise, get all orders
        else {
            // Query the admin_orders_view
            logMessage("Fetching all orders from admin_orders_view");
            $ordersResult = supabaseRequest(
                "/rest/v1/admin_orders_view?select=*&order=created_at.desc",
                'GET'
            );
            
            if ($ordersResult['status'] !== 200) {
                throw new Exception("Failed to fetch orders");
            }
            
            echo json_encode([
                'success' => true,
                'orders' => $ordersResult['data']
            ]);
        }
    } 
    // Handle PUT requests for updating order status
    else if ($_SERVER['REQUEST_METHOD'] === 'PUT' && $orderId && $action === 'status') {
        $requestData = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($requestData['status'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Status is required'
            ]);
            exit();
        }
        
        $newStatus = $requestData['status'];
        $success = updateOrderStatus($orderId, $newStatus);
        
        if ($success) {
            echo json_encode([
                'success' => true,
                'message' => 'Order status updated successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to update order status'
            ]);
        }
    } 
    // Handle unsupported methods
    else {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed'
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