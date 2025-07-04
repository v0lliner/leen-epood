<?php
/**
 * API endpoint for Maksekeskus payment return
 */

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../config.php';

use Leen\Shop\Logger;

// Initialize logger
$logger = new Logger();

try {
    // Get transaction ID and status from query string
    $transactionId = $_GET['transaction'] ?? '';
    $status = $_GET['status'] ?? '';
    
    $logger->info("Payment return: transaction=$transactionId, status=$status");
    
    // Redirect to appropriate page
    if ($status === 'completed') {
        // Payment successful
        header('Location: ' . SITE_URL . '/makse/korras?transaction=' . urlencode($transactionId));
    } else {
        // Payment failed or cancelled
        header('Location: ' . SITE_URL . '/makse/katkestatud?status=' . urlencode($status));
    }
    
} catch (Exception $e) {
    $logger->error('Error processing return: ' . $e->getMessage());
    
    // Redirect to error page
    header('Location: ' . SITE_URL . '/makse/viga');
}