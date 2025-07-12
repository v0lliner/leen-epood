<?php
// Main PHP router for API endpoints
header('Content-Type: application/json');

// Get the requested path from the URL
$path = isset($_GET['path']) ? trim($_GET['path'], '/') : '';
 
// Handle different API endpoints
if (strpos($path, 'omniva_integration/get_locations.php') === 0) {
    // New modular Omniva parcel machines endpoint
    require_once __DIR__ . '/omniva_integration/get_locations.php';
    $handlerFound = true;
} else if (strpos($path, 'omniva_integration/get_locations') === 0) {
    // New modular Omniva parcel machines endpoint
    require_once __DIR__ . '/omniva_integration/get_locations.php';
    $handlerFound = true;
} else if (strpos($path, 'maksekeskus_integration/process_payment') === 0) {
    // Maksekeskus payment processing endpoint
    require_once __DIR__ . '/maksekeskus_integration/process_payment.php';
    $handlerFound = true;
} else if (strpos($path, 'process-payment') === 0) {
    // Legacy payment processing endpoint - redirect to new endpoint
    require_once __DIR__ . '/maksekeskus_integration/process_payment.php';
    $handlerFound = true;
} else if (strpos($path, 'register-omniva-shipment') === 0) {
    // Omniva shipment registration endpoint
    require_once __DIR__ . '/register-omniva-shipment.php';
    $handlerFound = true;
} else if (strpos($path, 'mailer') === 0) {
    // Contact form mailer endpoint
    header('Content-Type: application/json');
    require_once __DIR__ . '/mailer.php';
    $handlerFound = true;
} else if (strpos($path, 'admin/orders') === 0) {
    // Admin orders endpoint
    require_once __DIR__ . '/admin/orders.php';
    $handlerFound = true;
}

// If no handler was found, return 404
if (!isset($handlerFound) || !$handlerFound) {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
}