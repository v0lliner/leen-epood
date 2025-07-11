<?php
/**
 * Maksekeskus payment notification handler
 * 
 * This file should not be accessed directly, but through the index.php router.
 */

// Redirect to index.php router if accessed directly
if (!defined('ROUTER_INCLUDED')) {
    header('Location: /php/payment-notification');
    exit;
}

// This file is included by index.php router
// Process payment notification from Maksekeskus
require_once __DIR__ . '/payment-notification.php';