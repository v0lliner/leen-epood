<?php
/**
 * Payment notification redirect endpoint
 * 
 * This file serves as a redirect to teavitus.php for backward compatibility.
 * Maksekeskus sends notifications to this endpoint, which then forwards
 * the request to the main handler.
 */

// Initialize error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them

// Set up logging
$logDir = dirname(__DIR__) . '/logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0777, true);
}
$logFile = $logDir . '/payment_redirect.log';

// Function to log messages
function redirectLog($message, $data = null) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[{$timestamp}] {$message}";
    
    if ($data !== null) {
        $logEntry .= ": " . (is_string($data) ? $data : json_encode($data));
    }
    
    $logEntry .= PHP_EOL;
    
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}

// Log the incoming request
redirectLog("Payment notification redirect received", [
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown'
]);

// Include the actual notification handler
require_once __DIR__ . '/teavitus.php';

// Log completion
redirectLog("Payment notification redirect completed");