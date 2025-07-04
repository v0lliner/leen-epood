<?php
/**
 * API endpoint for getting payment methods
 */

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../config.php';

use Leen\Shop\MaksekeskusService;
use Leen\Shop\Logger;

// Set headers
header('Content-Type: application/json');

// Initialize services
$maksekeskusService = new MaksekeskusService();
$logger = new Logger();

try {
    // Check if request method is GET
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception('Invalid request method');
    }
    
    // Get amount from query string
    $amount = isset($_GET['amount']) ? (float) $_GET['amount'] : 0;
    
    if ($amount <= 0) {
        throw new Exception('Invalid amount');
    }
    
    // Get payment methods
    $methods = $maksekeskusService->getPaymentMethods($amount);
    
    // Return payment methods
    echo json_encode([
        'success' => true,
        'methods' => $methods
    ]);
    
} catch (Exception $e) {
    $logger->error('Error getting payment methods: ' . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}