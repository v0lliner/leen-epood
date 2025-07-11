<?php
// Shared Supabase configuration helper for Maksekeskus integration

// Enable error logging
if (!is_dir(__DIR__ . '/../../../logs')) {
    mkdir(__DIR__ . '/../../../logs', 0755, true);
}
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../../logs/php_errors.log');
error_log('========== SUPABASE CONFIG LOADING ==========');

// Function to get Maksekeskus configuration from Supabase
function getMaksekeskusConfig() {
    // Load Supabase environment variables
    $env_file = __DIR__ . '/../../../.env';
    
    // Debug log
    error_log('Looking for .env file at: ' . $env_file);
    error_log('File exists: ' . (file_exists($env_file) ? 'YES' : 'NO'));
    
    if (file_exists($env_file)) {
        $env_content = @file_get_contents($env_file);
        error_log('File content read: ' . ($env_content !== false ? 'SUCCESS' : 'FAILED'));
        error_log('File content length: ' . (strlen($env_content ?? '')));
        
        // More robust parsing of .env file
        error_log('Parsing .env file content...');
        preg_match_all('/^\s*([\w.-]+)\s*=\s*([^\r\n]*?)(?:\s*(?:#|$))/m', $env_content, $matches, PREG_SET_ORDER);
        
        $found_vars = [];
        foreach ($matches as $match) {
            if (isset($match[1]) && isset($match[2])) {
                $key = trim($match[1]);
                $value = trim($match[2]);
                
                $found_vars[] = $key;
                
                // Remove quotes if present
                if (preg_match('/^([\'"])(.*)\1$/', $value, $quote_matches)) {
                    $value = $quote_matches[2];
                }
                
                $_ENV[$key] = $value;
                putenv("$key=$value"); // Also set in environment for getenv()
            }
        }
        error_log('Found variables in .env: ' . implode(', ', $found_vars));
    }
    
    // Get Supabase credentials
    // Try multiple ways to get the variables
    $supabase_url = $_ENV['VITE_SUPABASE_URL'] ?? '';
    if (empty($supabase_url)) $supabase_url = getenv('VITE_SUPABASE_URL') ?: '';
    
    $supabase_key = $_ENV['VITE_SUPABASE_SERVICE_ROLE_KEY'] ?? '';
    if (empty($supabase_key)) $supabase_key = getenv('VITE_SUPABASE_SERVICE_ROLE_KEY') ?: '';
    
    // Debug log
    error_log('Supabase URL: ' . (empty($supabase_url) ? 'MISSING' : 'Found (length: ' . strlen($supabase_url) . ')'));
    error_log('Supabase Key: ' . (empty($supabase_key) ? 'MISSING' : 'Found (length: ' . strlen($supabase_key) . ')'));
    
    // Try direct environment variables as a fallback
    if (empty($supabase_url) || empty($supabase_key)) {
        error_log('Trying to read environment variables directly...');
        // Read all environment variables
        $env_vars = getenv();
        error_log('All environment variables: ' . implode(', ', array_keys($env_vars)));
    }
    
    if (!$supabase_url || !$supabase_key) {
        error_log('ERROR: Supabase configuration is missing. URL or key not found in .env file.');
        error_log('Current working directory: ' . getcwd());
        error_log('PHP version: ' . phpversion());
        error_log('Server software: ' . ($_SERVER['SERVER_SOFTWARE'] ?? 'unknown'));
        throw new Exception('Supabase configuration is missing');
    }
    
    error_log('Preparing to query Supabase API...');
    
    // Query Supabase for active Maksekeskus configuration
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabase_url . '/rest/v1/maksekeskus_config?active=eq.true&select=*&limit=1');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_VERBOSE, true);
    $verbose = fopen('php://temp', 'w+');
    curl_setopt($ch, CURLOPT_STDERR, $verbose);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabase_key,
        'Authorization: Bearer ' . $supabase_key,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ]);
    
    $response = curl_exec($ch);
    $curl_errno = curl_errno($ch);
    $curl_error = curl_error($ch);
    $status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    // Get verbose information
    rewind($verbose);
    $verboseLog = stream_get_contents($verbose);
    error_log('cURL verbose log: ' . $verboseLog);
    
    curl_close($ch);

    // Debug log
    error_log('Supabase API response status: ' . $status_code . ' (curl_errno: ' . $curl_errno . ')');
    if ($curl_errno) {
        error_log('cURL error: ' . $curl_error);
    }
    error_log('Response body length: ' . strlen($response));
    error_log('Response body preview: ' . substr($response, 0, 100) . (strlen($response) > 100 ? '...' : ''));
    
    if ($status_code !== 200) {
        error_log('ERROR: Failed to fetch Maksekeskus configuration. Status code: ' . $status_code);
        error_log('Response: ' . $response);
        throw new Exception('Failed to fetch Maksekeskus configuration from Supabase');
    }
    
    $config = json_decode($response, true);
    
    error_log('JSON decode result: ' . (json_last_error() === JSON_ERROR_NONE ? 'SUCCESS' : 'FAILED - ' . json_last_error_msg()));
    error_log('Config array: ' . (is_array($config) ? 'YES' : 'NO'));
    error_log('Config count: ' . (is_array($config) ? count($config) : 'N/A'));
    
    if (empty($config) || !is_array($config) || count($config) === 0) {
        error_log('ERROR: No active Maksekeskus configuration found in Supabase');
        throw new Exception('No active Maksekeskus configuration found');
    }
    
    // Debug log
    error_log('Maksekeskus config loaded successfully.');
    error_log('Shop ID: ' . ($config[0]['shop_id'] ?? 'N/A'));
    error_log('Test mode: ' . (isset($config[0]['test_mode']) && $config[0]['test_mode'] ? 'true' : 'false'));
    error_log('API keys present: ' . (isset($config[0]['api_secret_key']) && !empty($config[0]['api_secret_key']) ? 'YES' : 'NO'));
    error_log('========== SUPABASE CONFIG LOADING COMPLETE ==========');
    
    return $config[0];
}