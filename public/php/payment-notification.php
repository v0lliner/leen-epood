<?php
/**
 * Payment notification webhook
 * 
 * This endpoint receives payment notifications from Maksekeskus and processes them.
 */

// Set headers
header('Content-Type: application/json');

try {
    // Get Maksekeskus configuration from database
    $supabaseUrl = getenv('VITE_SUPABASE_URL');
    $supabaseKey = getenv('VITE_SUPABASE_SERVICE_ROLE_KEY');
    
    if (!$supabaseUrl || !$supabaseKey) {
        throw new Exception('Missing Supabase credentials');
    }
    
    // Get active Maksekeskus configuration
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/maksekeskus_config?active=eq.true&limit=1');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey
    ]);
    
    $response = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($statusCode !== 200) {
        throw new Exception('Failed to get Maksekeskus configuration: ' . $response);
    }
    
    $configs = json_decode($response, true);
    
    if (empty($configs)) {
        throw new Exception('No active Maksekeskus configuration found');
    }
    
    $config = $configs[0];
    
    // Initialize Maksekeskus client
    $maksekeskus = new \Maksekeskus\Maksekeskus(
        $config['shop_id'],
        $config['api_open_key'],
        $config['api_secret_key'],
        $config['test_mode']
    );
    
    // Verify the notification
    if (!$maksekeskus->verifyMac($_REQUEST)) {
        throw new Exception('Invalid MAC signature');
    }
    
    // Extract data from the notification
    $data = $maksekeskus->extractRequestData($_REQUEST);
    
    // Log the notification
    error_log('Payment notification received: ' . json_encode($data));
    
    // Send notification email to admin
    if ($data['status'] === 'COMPLETED') {
        $to = 'leen@leen.ee';
        $subject = 'Uus tellimus - ' . $data['transaction'];
        $message = "Uus tellimus on edukalt makstud!\n\n";
        $message .= "Tellimuse ID: " . $data['transaction'] . "\n";
        $message .= "Summa: " . $data['amount'] . " " . $data['currency'] . "\n";
        $message .= "Aeg: " . date('Y-m-d H:i:s') . "\n\n";
        $message .= "Vaata tellimust administreerimisliideses.";
        
        $headers = 'From: noreply@leen.ee' . "\r\n" .
            'Reply-To: noreply@leen.ee' . "\r\n" .
            'X-Mailer: PHP/' . phpversion();
        
        mail($to, $subject, $message, $headers);
    }
    
    // Process the notification based on status
    if ($data['status'] === 'COMPLETED') {
        // Payment was successful
        // Here you would typically update your order status in the database
        
        // For now, just log the success
        error_log('Payment completed successfully for transaction: ' . $data['transaction']);
    } else if ($data['status'] === 'CANCELLED') {
        // Payment was cancelled
        error_log('Payment cancelled for transaction: ' . $data['transaction']);
    } else if ($data['status'] === 'EXPIRED') {
        // Payment expired
        error_log('Payment expired for transaction: ' . $data['transaction']);
    }
    
    // Return success response
    echo json_encode(['success' => true]);
    
} catch (Exception $e) {
    // Log error
    error_log('Payment notification error: ' . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}