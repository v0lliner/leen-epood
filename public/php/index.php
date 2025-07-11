<?php
/**
 * Main entry point for all API requests
 * 
 * This file acts as a router, directing requests to the appropriate handlers
 * based on the request path.
 */

// Initialize error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load environment variables
$env_file = __DIR__ . '/../../.env';
if (file_exists($env_file)) {
    $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        
        if (!empty($name)) {
            putenv("$name=$value");
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

// Get the request path
$path = $_SERVER['PATH_INFO'] ?? '';
$path = trim($path, '/');

// Flag to track if a handler was found
$handlerFound = false;

// Handle different API endpoints
if (strpos($path, 'get-omniva-parcel-machines') === 0) {
    // Omniva parcel machines endpoint
    require_once __DIR__ . '/get-omniva-parcel-machines.php';
    $handlerFound = true;
} else if (strpos($path, 'process-payment') === 0) {
    // Payment processing endpoint
    require_once __DIR__ . '/maksekeskus/lib/Maksekeskus.php'; // Load Maksekeskus SDK
    require_once __DIR__ . '/maksekeskus/vendor/autoload.php'; // Load Maksekeskus autoloader
    require_once __DIR__ . '/process-payment.php';
    $handlerFound = true;
} else if (strpos($path, 'payment-notification') === 0) {
    // Payment notification webhook
    require_once __DIR__ . '/maksekeskus/lib/Maksekeskus.php'; // Load Maksekeskus SDK
    require_once __DIR__ . '/maksekeskus/vendor/autoload.php'; // Load Maksekeskus autoloader
    require_once __DIR__ . '/payment-notification.php';
    $handlerFound = true;
} else if (strpos($path, 'teavitus') === 0) {
    // Maksekeskus notification webhook (Estonian naming convention)
    define('ROUTER_INCLUDED', true);
    require_once __DIR__ . '/maksekeskus/lib/Maksekeskus.php'; // Load Maksekeskus SDK
    require_once __DIR__ . '/maksekeskus/vendor/autoload.php'; // Load Maksekeskus autoloader
    require_once __DIR__ . '/teavitus.php';
    $handlerFound = true;
}

// If no handler was found, return 404
if (!$handlerFound) {
    header('Content-Type: application/json');
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
    exit;
}