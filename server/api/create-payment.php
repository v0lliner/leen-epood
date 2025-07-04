<?php
/**
 * API endpoint for creating a payment
 */

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../config.php';

use Leen\Shop\MaksekeskusService;
use Leen\Shop\OrderService;
use Leen\Shop\Logger;

// Set headers
header('Content-Type: application/json');

// Initialize services
$maksekeskusService = new MaksekeskusService();
$orderService = new OrderService();
$logger = new Logger();

try {
    // Check if request method is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }
    
    // Get request body
    $requestBody = file_get_contents('php://input');
    $data = json_decode($requestBody, true);
    
    if (!$data) {
        throw new Exception('Invalid request data');
    }
    
    // Validate required fields
    if (empty($data['orderData']) || empty($data['paymentMethod'])) {
        throw new Exception('Missing required fields');
    }
    
    $orderData = $data['orderData'];
    $paymentMethod = $data['paymentMethod'];
    
    // Create order in database
    $orderId = $orderService->createOrder($orderData);
    
    // Add order ID to order data
    $orderData['id'] = $orderId;
    
    // Create transaction
    $transaction = $maksekeskusService->createTransaction($orderData, $paymentMethod);
    
    // Return transaction data
    echo json_encode([
        'success' => true,
        'order_id' => $orderId,
        'transaction_id' => $transaction['transaction_id'],
        'payment_url' => $transaction['payment_url']
    ]);
    
} catch (Exception $e) {
    $logger->error('Error creating payment: ' . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}