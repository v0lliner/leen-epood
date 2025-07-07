<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them

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

// Require the Maksekeskus SDK
require __DIR__ . '/maksekeskus/vendor/autoload.php';
use Maksekeskus\Maksekeskus;

// Log file for debugging
$logFile = __DIR__ . '/parcel_machines_log.txt';

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

try {
    // Get country from query parameter, default to 'ee' (Estonia)
    $country = isset($_GET['country']) ? strtolower($_GET['country']) : 'ee';
    
    // Get carrier from query parameter, default to all carriers
    $carrier = isset($_GET['carrier']) ? $_GET['carrier'] : null;
    
    logMessage("Fetching parcel machines", ["country" => $country, "carrier" => $carrier]);
    
    // Initialize Maksekeskus client
    $shopId = '4e2bed9a-aa24-4b87-801b-56c31c535d36';
    $publicKey = 'wjoNf3DtQe11pIDHI8sPnJAcDT2AxSwM';
    $privateKey = 'WzFqjdK9Ksh9L77hv3I0XRzM8IcnSBHwulDvKI8yVCjVVbQxDBiutOocEACFCTmZ';
    $testMode = false; // Set to false for production
    
    $MK = new Maksekeskus($shopId, $publicKey, $privateKey, $testMode);
    
    // Prepare request body for getDestinations
    $requestBody = [
        'country' => $country
    ];
    
    // Add carrier if specified
    if ($carrier) {
        $requestBody['carrier'] = $carrier;
    }
    
    // Get parcel machine destinations
    $destinations = $MK->getDestinations($requestBody);
    
    logMessage("Destinations fetched successfully", count($destinations));
    
    // Return the destinations
    echo json_encode([
        'success' => true,
        'destinations' => $destinations
    ]);
    
} catch (Exception $e) {
    logMessage("Error fetching destinations", $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}