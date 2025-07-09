<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them

// Set content type to JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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
$logFile = $logDir . '/omniva_shipping_settings.log';

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
    } else if ($method === 'PUT') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
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

// Main execution starts here
try {
    logMessage("Received request", ['method' => $_SERVER['REQUEST_METHOD']]);
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get Omniva shipping settings
        $result = supabaseRequest(
            "/rest/v1/omniva_shipping_settings?active=eq.true&select=*",
            'GET'
        );
        
        if ($result['status'] !== 200) {
            throw new Exception("Failed to fetch Omniva shipping settings");
        }
        
        // If no settings found, return default values
        if (empty($result['data'])) {
            echo json_encode([
                'success' => true,
                'settings' => [
                    'price' => 3.99,
                    'currency' => 'EUR',
                    'active' => true
                ]
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'settings' => $result['data'][0]
            ]);
        }
    } else if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Get request data
        $requestData = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($requestData['price']) || !is_numeric($requestData['price'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Price is required and must be a number'
            ]);
            exit();
        }
        
        // Prepare data for update
        $updateData = [
            'price' => (float) $requestData['price'],
            'currency' => $requestData['currency'] ?? 'EUR',
            'active' => isset($requestData['active']) ? (bool) $requestData['active'] : true
        ];
        
        // Check if settings already exist
        $existingResult = supabaseRequest(
            "/rest/v1/omniva_shipping_settings?select=id",
            'GET'
        );
        
        if ($existingResult['status'] !== 200) {
            throw new Exception("Failed to check existing Omniva shipping settings");
        }
        
        if (empty($existingResult['data'])) {
            // Create new settings
            $result = supabaseRequest(
                "/rest/v1/omniva_shipping_settings",
                'POST',
                $updateData
            );
            
            if ($result['status'] !== 201) {
                throw new Exception("Failed to create Omniva shipping settings");
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Omniva shipping settings created successfully',
                'settings' => $updateData
            ]);
        } else {
            // Update existing settings
            $settingId = $existingResult['data'][0]['id'];
            
            $result = supabaseRequest(
                "/rest/v1/omniva_shipping_settings?id=eq.$settingId",
                'PUT',
                $updateData
            );
            
            if ($result['status'] !== 204) {
                throw new Exception("Failed to update Omniva shipping settings");
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Omniva shipping settings updated successfully',
                'settings' => $updateData
            ]);
        }
    } else {
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