<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them

// Load environment variables
require_once __DIR__ . '/env-loader.php';

// Set content type to JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Log file for debugging
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}
$logFile = $logDir . '/admin_stats.log';

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
        logMessage("cURL Error", $error);
        return ['error' => $error, 'status' => $statusCode];
    }
    
    return [
        'data' => json_decode($response, true),
        'status' => $statusCode
    ];
}

try {
    logMessage("Starting order stats request");
    
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
                logMessage("Loaded SUPABASE_SERVICE_ROLE_KEY from alternate location");
            }
        }
        
        // If still not set, log an error
        if (!getenv('SUPABASE_SERVICE_ROLE_KEY')) {
            logMessage("Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set");
            throw new Exception("API credentials not configured");
        }
    }
    
    // Query the admin_order_stats view
    $statsResult = supabaseRequest(
        "/rest/v1/admin_order_stats",
        'GET'
    );
    
    if ($statsResult['status'] !== 200) {
        logMessage("Error fetching order stats", $statsResult);
        throw new Exception("Failed to fetch order statistics");
    }
    
    $stats = $statsResult['data'][0] ?? null;
    
    if (!$stats) {
        // If no stats found, create default stats
        $stats = [
            'total_orders' => 0,
            'pending_orders' => 0,
            'paid_orders' => 0,
            'processing_orders' => 0,
            'shipped_orders' => 0,
            'completed_orders' => 0,
            'cancelled_orders' => 0,
            'refunded_orders' => 0,
            'total_revenue' => 0,
            'confirmed_revenue' => 0
        ];
    }
    
    // Convert to integers and format numbers
    foreach ($stats as $key => $value) {
        if (strpos($key, 'orders') !== false) {
            $stats[$key] = (int)$value;
        } else if (strpos($key, 'revenue') !== false) {
            $stats[$key] = (float)$value;
        }
    }
    
    logMessage("Successfully fetched order stats", $stats);
    
    // Return the stats
    echo json_encode([
        'success' => true,
        'stats' => $stats
    ]);
    
} catch (Exception $e) {
    logMessage("Exception", $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}