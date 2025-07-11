<?php
// Start output buffering to prevent any unwanted output
ob_start();

// Set headers for JSON response
header('Content-Type: application/json');

// Load dependencies
require_once __DIR__ . '/../php/maksekeskus_integration/supabase_config.php';
require_once __DIR__ . '/../php/maksekeskus/lib/Maksekeskus.php';
require_once __DIR__ . '/../php/maksekeskus/vendor/autoload.php';

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

// Function to return JSON response and end script execution
function returnJsonResponse($data, $statusCode = 200) {
    // Clean any output that might have been generated
    if (ob_get_length()) ob_clean();
    
    // Set status code
    http_response_code($statusCode);
    
    // Return JSON response
    echo json_encode($data);
    exit;
}

try {
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
    
    // Verify the notification signature
    if (!$client->verifyMac($requestData)) {
        returnJsonResponse(['error' => 'Invalid signature'], 400);
    }
    
    // Extract message data
    $messageData = $client->extractRequestData($requestData);
    
    // Log the notification (with sensitive data masked)
    $safeData = $messageData;
    if (isset($safeData['customer']['email'])) {
        $email = $safeData['customer']['email'];
        $atPos = strpos($email, '@');
        if ($atPos !== false) {
            $username = substr($email, 0, $atPos);
            $domain = substr($email, $atPos);
            $maskedUsername = substr($username, 0, 2) . str_repeat('*', strlen($username) - 2);
            $safeData['customer']['email'] = $maskedUsername . $domain;
        }
    }
    if (isset($safeData['customer']['phone'])) {
        $phone = $safeData['customer']['phone'];
        $safeData['customer']['phone'] = substr($phone, 0, 4) . str_repeat('*', strlen($phone) - 6) . substr($phone, -2);
    }
    
    safeLog('payment_notifications.log', json_encode($safeData));
    
    // Update order status in Supabase
    if (isset($messageData['merchant_data']['order_id']) && isset($messageData['status'])) {
        $orderId = $messageData['merchant_data']['order_id'];
        $status = $messageData['status'];
        
        // Connect to Supabase
        $supabase_url = $_ENV['VITE_SUPABASE_URL'] ?? getenv('VITE_SUPABASE_URL');
        $supabase_key = $_ENV['VITE_SUPABASE_SERVICE_ROLE_KEY'] ?? getenv('VITE_SUPABASE_SERVICE_ROLE_KEY');
        
        if (!$supabase_url || !$supabase_key) {
            throw new Exception('Supabase configuration is missing');
        }
        
        try {
            $supabaseService = new \PHPSupabase\Service($supabase_key, $supabase_url);
            $ordersDb = $supabaseService->initializeDatabase('orders', 'id');
            
            // Map Maksekeskus status to our order status
            $orderStatus = 'PENDING';
            $paymentStatus = $status;
            
            switch ($status) {
                case 'COMPLETED':
                    $orderStatus = 'PAID';
                    break;
                case 'CANCELLED':
                    $orderStatus = 'CANCELLED';
                    break;
                case 'EXPIRED':
                    $orderStatus = 'CANCELLED';
                    break;
                case 'REFUNDED':
                    $orderStatus = 'REFUNDED';
                    break;
            }
            
            // Update order
            $updateData = [
                'status' => $orderStatus,
                'payment_status' => $paymentStatus,
                'updated_at' => date('c')
            ];
            
            $ordersDb->update($orderId, $updateData);
            
            if ($ordersDb->getError()) {
                throw new Exception('Failed to update order: ' . $ordersDb->getError());
            }
            
            // Send email notification for completed payments
            if ($status === 'COMPLETED') {
                // Get order details
                $ordersDb->findBy('id', $orderId);
                $order = $ordersDb->getFirstResult();
                
                if ($order && isset($order->customer_email)) {
                    // Send email to customer
                    $to = $order->customer_email;
                    $subject = 'Teie tellimus on kinnitatud - Leen.ee';
                    $message = "Tere, {$order->customer_name}!\n\n";
                    $message .= "Teie tellimus on edukalt kinnitatud ja makse on laekunud.\n\n";
                    $message .= "Tellimuse number: {$order->id}\n";
                    $message .= "Summa: {$order->total_amount}€\n\n";
                    $message .= "Täname teid ostu eest!\n\n";
                    $message .= "Parimate soovidega,\nLeen.ee meeskond";
                    
                    $headers = 'From: leen@leen.ee' . "\r\n" .
                               'Reply-To: leen@leen.ee' . "\r\n" .
                               'X-Mailer: PHP/' . phpversion();
                    
                    try {
                        mail($to, $subject, $message, $headers);
                    } catch (Exception $mailEx) {
                        safeLog('payment_errors.log', 'Email sending error: ' . $mailEx->getMessage());
                    }
                    
                    // Send notification to admin
                    $adminEmail = 'leen@leen.ee';
                    $adminSubject = 'Uus tellimus - Leen.ee';
                    $adminMessage = "Uus tellimus on laekunud:\n\n";
                    $adminMessage .= "Tellimuse number: {$order->id}\n";
                    $adminMessage .= "Klient: {$order->customer_name}\n";
                    $adminMessage .= "E-post: {$order->customer_email}\n";
                    $adminMessage .= "Telefon: {$order->customer_phone}\n";
                    $adminMessage .= "Summa: {$order->total_amount}€\n\n";
                    $adminMessage .= "Vaata tellimust administreerimisliideses.";
                    
                    try {
                        mail($adminEmail, $adminSubject, $adminMessage, $headers);
                    } catch (Exception $mailEx) {
                        safeLog('payment_errors.log', 'Admin email sending error: ' . $mailEx->getMessage());
                    }
                }
            }
        } catch (Exception $dbEx) {
            safeLog('payment_errors.log', 'Database error in notification handler: ' . $dbEx->getMessage());
            returnJsonResponse(['error' => 'Database error'], 500);
        }
    }
    
    // Return success response
    returnJsonResponse(['success' => true]);
    
} catch (Exception $e) {
    // Log the error
    safeLog('payment_errors.log', 'Notification error: ' . $e->getMessage());
    
    // Always return 200 OK to Maksekeskus to prevent retries
    returnJsonResponse([
        'success' => false,
        'error' => 'Notification processing failed'
    ], 200);
}