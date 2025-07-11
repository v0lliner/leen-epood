<?php
/**
 * Main entry point for all API requests
 * 
 * This file acts as a router, directing requests to the appropriate controllers
 * based on the request path.
 */

// Initialize error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them

// Check if Composer autoloader exists and load it
$composerAutoloadPaths = [
    __DIR__ . '/maksekeskus/vendor/autoload.php',
    __DIR__ . '/vendor/autoload.php',
    __DIR__ . '/../vendor/autoload.php'
];

foreach ($composerAutoloadPaths as $autoloadPath) {
    if (file_exists($autoloadPath)) {
        require_once $autoloadPath;
        break;
    }
}

// Load utilities
require_once __DIR__ . '/Utils/Logger.php';
require_once __DIR__ . '/Utils/EnvLoader.php';

// Initialize logger
$logger = new \Utils\Logger('Router', 'router.log');
$logger->info("Request received", [
    'uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
]);

// Ensure Httpful is loaded if needed
if (!class_exists('\\Httpful\\Request') && file_exists(__DIR__ . '/maksekeskus/vendor/nategood/httpful/bootstrap.php')) {
    $logger->info("Loading Httpful bootstrap");
    require_once __DIR__ . '/maksekeskus/vendor/nategood/httpful/bootstrap.php';
}

// Set default content type to JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Parse the request URI to determine the controller and action
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove the base path if needed (e.g., /php/ or /api/)
$basePath = '/php/';
if (strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
}

// Route the request to the appropriate controller
try {
    // Load environment variables
    $envLoader = new \Utils\EnvLoader($logger);
    if (!$envLoader->load()) {
        throw new Exception("Failed to load environment variables");
    }
    
    // Initialize Supabase client
    require_once __DIR__ . '/Repositories/SupabaseRepository.php';
    $supabase = new \Repositories\SupabaseRepository(
        $envLoader->getRequired('SUPABASE_URL'),
        $envLoader->getRequired('SUPABASE_SERVICE_ROLE_KEY'),
        $logger
    );
    
    // Map paths to controllers
    if (strpos($path, 'process-payment') === 0) {
        // Payment processing endpoint
        require_once __DIR__ . '/Controllers/PaymentController.php';
        $controller = new \Controllers\PaymentController($logger, $envLoader, $supabase);
        $controller->processPayment();
    } 
    else if (strpos($path, 'payment-notification') === 0 || strpos($path, 'teavitus') === 0) {
        // Payment notification webhook
        require_once __DIR__ . '/Controllers/WebhookController.php';
        $controller = new \Controllers\WebhookController($logger, $envLoader, $supabase);
        $controller->handleNotification();
    }
    else if (strpos($path, 'get-omniva-parcel-machines') === 0) {
        // Omniva parcel machines endpoint
        require_once __DIR__ . '/Controllers/OmnivaController.php';
        $controller = new \Controllers\OmnivaController($logger, $envLoader, $supabase);
        $controller->getParcelMachines();
    }
    else if (strpos($path, 'register-omniva-shipment') === 0) {
        // Omniva shipment registration endpoint
        require_once __DIR__ . '/Controllers/OmnivaController.php';
        $controller = new \Controllers\OmnivaController($logger, $envLoader, $supabase);
        $controller->registerShipment();
    }
    else {
        // 404 Not Found
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        $logger->error("Endpoint not found", ['path' => $path]);
    }
} catch (Exception $e) {
    // Log the error
    $logger->exception($e, "Router exception");
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error: ' . $e->getMessage()
    ]);
}