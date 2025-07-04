<?php
/**
 * API endpoint for Maksekeskus payment notifications
 */

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../config.php';

use Leen\Shop\MaksekeskusService;
use Leen\Shop\OrderService;
use Leen\Shop\Logger;

// Initialize services
$maksekeskusService = new MaksekeskusService();
$orderService = new OrderService();
$logger = new Logger();

try {
    // Get raw request body
    $payload = file_get_contents('php://input');
    
    // Get MAC signature from header
    $mac = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    // Log the notification
    $logger->info('Received notification: ' . substr($payload, 0, 100) . '...');
    
    // Always respond with 200 OK first to acknowledge receipt
    http_response_code(200);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'ok']);
    
    // Process notification asynchronously
    // This ensures we respond quickly to Maksekeskus
    fastcgi_finish_request();
    
    // Process the notification
    $notification = $maksekeskusService->processNotification($payload, $mac);
    
    // Map Maksekeskus status to our status
    $statusMap = [
        'COMPLETED' => 'COMPLETED',
        'CANCELLED' => 'CANCELLED',
        'EXPIRED' => 'EXPIRED',
        'PENDING' => 'PENDING'
    ];
    
    $status = $statusMap[$notification['status']] ?? 'UNKNOWN';
    
    // Update order status
    if ($notification['order_id']) {
        $orderService->updateOrderPaymentStatus(
            $notification['order_id'],
            $status,
            $notification['transaction_id']
        );
        
        $logger->info("Updated order #{$notification['order_id']} status to $status");
    } else {
        $logger->warning("Notification missing order_id: " . json_encode($notification));
    }
    
} catch (Exception $e) {
    $logger->error('Error processing notification: ' . $e->getMessage());
    
    // We've already sent a 200 OK response, so just log the error
}