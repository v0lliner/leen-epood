<?php
/**
 * API endpoint for Maksekeskus payment cancellation
 */

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../config.php';

use Leen\Shop\Logger;

// Initialize logger
$logger = new Logger();

try {
    // Get transaction ID from query string
    $transactionId = $_GET['transaction'] ?? '';
    
    $logger->info("Payment cancelled: transaction=$transactionId");
    
    // Redirect to cancel page
    header('Location: ' . SITE_URL . '/makse/katkestatud');
    
} catch (Exception $e) {
    $logger->error('Error processing cancellation: ' . $e->getMessage());
    
    // Redirect to error page
    header('Location: ' . SITE_URL . '/makse/viga');
}