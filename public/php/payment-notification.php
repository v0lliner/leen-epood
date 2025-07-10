<?php
// This file is a redirect to teavitus.php
// It's needed because Maksekeskus sends notifications to this endpoint

// Set up basic logging for this redirect file
$redirectLogFile = dirname(__DIR__) . '/logs/payment_redirect.log';
file_put_contents($redirectLogFile, date('Y-m-d H:i:s') . " - Payment notification received at payment-notification.php\n", FILE_APPEND);

// Include the actual notification handler
require_once __DIR__ . '/teavitus.php';

// Log after processing
file_put_contents($redirectLogFile, date('Y-m-d H:i:s') . " - Payment notification processing completed\n", FILE_APPEND);