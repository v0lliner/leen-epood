<?php
// Shared Supabase configuration helper for Maksekeskus integration

// Enable error logging
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../../logs/php_errors.log');

// Function to get Maksekeskus configuration from Supabase
function getMaksekeskusConfig() {
    // Load Supabase environment variables
    $env_file = __DIR__ . '/../../../.env';
    
    // Debug log
    error_log('Loading .env file from: ' . $env_file);
    
    if (file_exists($env_file)) {
        $env_content = file_get_contents($env_file);
        
        // More robust parsing of .env file
        preg_match_all('/^\s*([\w.-]+)\s*=\s*([^\r\n]*?)(?:\s*(?:#|$))/m', $env_content, $matches, PREG_SET_ORDER);
        
        foreach ($matches as $match) {
            if (isset($match[1]) && isset($match[2])) {
                $key = trim($match[1]);
                $value = trim($match[2]);
                
                // Remove quotes if present
                if (preg_match('/^([\'"])(.*)\1$/', $value, $quote_matches)) {
                    $value = $quote_matches[2];
                }
                
                $_ENV[$key] = $value;
                putenv("$key=$value"); // Also set in environment for getenv()
            }
        }
    }
    
    // Get Supabase credentials
    $supabase_url = $_ENV['VITE_SUPABASE_URL'] ?? getenv('VITE_SUPABASE_URL') ?? '';
    $supabase_key = $_ENV['VITE_SUPABASE_SERVICE_ROLE_KEY'] ?? getenv('VITE_SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Debug log
    error_log('Supabase URL: ' . (empty($supabase_url) ? 'MISSING' : 'Found (length: ' . strlen($supabase_url) . ')'));
    error_log('Supabase Key: ' . (empty($supabase_key) ? 'MISSING' : 'Found (length: ' . strlen($supabase_key) . ')'));
    
    if (!$supabase_url || !$supabase_key) {
        error_log('ERROR: Supabase configuration is missing. URL or key not found in .env file.');
        throw new Exception('Supabase configuration is missing');
    }
    
    // Query Supabase for active Maksekeskus configuration
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabase_url . '/rest/v1/maksekeskus_config?active=eq.true&select=*&limit=1');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabase_key,
        'Authorization: Bearer ' . $supabase_key,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ]);
    
    $response = curl_exec($ch);
    $status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Debug log
    error_log('Supabase API response status: ' . $status_code);
    
    if ($status_code !== 200) {
        error_log('ERROR: Failed to fetch Maksekeskus configuration. Status code: ' . $status_code);
        error_log('Response: ' . $response);
        throw new Exception('Failed to fetch Maksekeskus configuration from Supabase');
    }
    
    $config = json_decode($response, true);
    
    if (empty($config) || !is_array($config) || count($config) === 0) {
        error_log('ERROR: No active Maksekeskus configuration found in Supabase');
        throw new Exception('No active Maksekeskus configuration found');
    }
    
    // Debug log
    error_log('Maksekeskus config loaded successfully. Shop ID: ' . ($config[0]['shop_id'] ?? 'N/A') . ', Test mode: ' . ($config[0]['test_mode'] ? 'true' : 'false'));
    
    return $config[0];
}