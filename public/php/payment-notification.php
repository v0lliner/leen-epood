<?php
// This file is a redirect to teavitus.php
// It's needed because Maksekeskus sends notifications to this endpoint

// Log that this endpoint was hit
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0777, true);
}
$logFile = $logDir . '/payment_notification_redirect.log';
file_put_contents($logFile, date('Y-m-d H:i:s') . " - Payment notification received at payment-notification.php\n", FILE_APPEND);

// Include the actual notification handler
require_once __DIR__ . '/teavitus.php';

// Log after processing
file_put_contents($logFile, date('Y-m-d H:i:s') . " - Payment notification processing completed\n", FILE_APPEND);