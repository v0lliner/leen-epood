<?php
// Start output buffering to prevent any unwanted output
ob_start();

// Set headers for JSON response (although this script redirects, it's good practice)
header('Content-Type: application/json');

// Define log directory in /tmp which is writable in most hosting environments
$logDir = '/tmp/leen_payment_logs';

// Safe logging function that falls back to error_log if file writing fails
function safeLog($logFile, $message) {
    global $logDir;
    $logPath = $logDir . '/' . $logFile;
    
    try {
        if (is_dir($logDir) && (is_writable($logDir) || is_writable($logPath))) {
            file_put_contents($logPath, date('Y-m-d H:i:s') . ' - ' . $message . PHP_EOL, FILE_APPEND);
        } else {
            // Fallback to PHP's error_log
            error_log('Payment log: ' . $message);
        }
    } catch (Exception $e) {
        error_log('Exception in safeLog: ' . $e->getMessage() . ' - Original message: ' . $message);
    }
}

try {
    // Load Supabase configuration
    require_once __DIR__ . '/../php/maksekeskus_integration/supabase_config.php';

    // Load Httpful library (required by Maksekeskus SDK)
    require_once __DIR__ . '/../php/httpful/bootstrap.php';

    // Load Maksekeskus SDK
    require_once __DIR__ . '/../php/maksekeskus/lib/Maksekeskus.php';

    // Get Maksekeskus configuration
    $config = getMaksekeskusConfig();
    
    $shopId = $config['shop_id'] ?? '';
    $publishableKey = $config['api_open_key'] ?? '';
    $secretKey = $config['api_secret_key'] ?? '';
    $testMode = $config['test_mode'] ?? false;
    
    if (!$shopId || !$secretKey) {
        throw new Exception('Maksekeskus configuration is incomplete');
    }
    
    // Initialize Maksekeskus client
    $client = new \Maksekeskus\Maksekeskus($shopId, $publishableKey, $secretKey, $testMode);
    
    // Get request data
    $requestData = $_REQUEST;
    
    // Verify the signature
    if (!$client->verifyMac($requestData)) {
        // Log the error but don't show it to the user
        safeLog('payment_errors.log', 'Invalid signature in success callback');
        
        // Clean output buffer
        ob_end_clean();
        
        // Redirect to success page anyway
        header('Location: /makse/korras');
        exit;
    }
    
    // Extract message data
    $messageData = $client->extractRequestData($requestData);
    
    // Log the success callback
    safeLog('payment_success.log', 'Success: ' . json_encode($messageData));
    
    // Clean output buffer
    ob_end_clean();
    
    // Redirect to success page
    header('Location: /makse/korras');
    exit;
    
} catch (Exception $e) {
    // Log the error
    safeLog('payment_errors.log', 'Success handler error: ' . $e->getMessage());
    
    // Clean output buffer
    ob_end_clean();
    
    // Redirect to success page anyway
    header('Location: /makse/korras');
    exit;
}