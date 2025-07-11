<?php
// Shared Supabase configuration helper for Maksekeskus integration

// Enable direct error display for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Try to create logs directory but don't fail if it can't be created
$logDir = __DIR__ . '/../../../logs';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0755, true);
    if (!is_dir($logDir)) {
        echo "WARNING: Could not create logs directory at $logDir\n";
    }
}

// Output directly to stderr for immediate visibility
echo "========== SUPABASE CONFIG LOADING ==========\n";

// Function to get Maksekeskus configuration from Supabase
function getMaksekeskusConfig() {
    // Load Supabase environment variables
    $env_file = __DIR__ . '/../../../.env';
    
    // Debug log
    echo 'Looking for .env file at: ' . $env_file . "\n";
    echo 'File exists: ' . (file_exists($env_file) ? 'YES' : 'NO') . "\n";
    
    if (file_exists($env_file)) {
        $env_content = @file_get_contents($env_file);
        echo 'File content read: ' . ($env_content !== false ? 'SUCCESS' : 'FAILED') . "\n";
        echo 'File content length: ' . (strlen($env_content ?? '')) . "\n";
        
        // More robust parsing of .env file
        echo "Parsing .env file content...\n";
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
        echo 'Found variables in .env: ' . implode(', ', $found_vars) . "\n";
    }
    
    // Get Supabase credentials
    // Try multiple ways to get the variables
    $supabase_url = $_ENV['VITE_SUPABASE_URL'] ?? '';
    if (empty($supabase_url)) $supabase_url = getenv('VITE_SUPABASE_URL') ?: '';
    
    $supabase_key = $_ENV['VITE_SUPABASE_SERVICE_ROLE_KEY'] ?? '';
    if (empty($supabase_key)) $supabase_key = getenv('VITE_SUPABASE_SERVICE_ROLE_KEY') ?: '';
    
    // Debug log
    echo 'Supabase URL: ' . (empty($supabase_url) ? 'MISSING' : 'Found (length: ' . strlen($supabase_url) . ')') . "\n";
    echo 'Supabase Key: ' . (empty($supabase_key) ? 'MISSING' : 'Found (length: ' . strlen($supabase_key) . ')') . "\n";
    
    // Try direct environment variables as a fallback
    if (empty($supabase_url) || empty($supabase_key)) {
        echo "Trying to read environment variables directly...\n";
        // Read all environment variables
        $env_vars = getenv();
        echo 'All environment variables: ' . implode(', ', array_keys($env_vars)) . "\n";
    }
    
    if (!$supabase_url || !$supabase_key) {
        echo "ERROR: Supabase configuration is missing. URL or key not found in .env file.\n";
        echo 'Current working directory: ' . getcwd() . "\n";
        echo 'PHP version: ' . phpversion() . "\n";
        echo 'Server software: ' . ($_SERVER['SERVER_SOFTWARE'] ?? 'unknown') . "\n";
        
        // Dump all environment variables for debugging
        echo "All environment variables:\n";
        foreach ($_ENV as $key => $value) {
            if (strpos($key, 'SUPABASE') !== false || strpos($key, 'VITE') !== false) {
                echo "$key: " . (strlen($value) > 0 ? "[SET]" : "[EMPTY]") . "\n";
            }
        }
        
        throw new Exception('Supabase configuration is missing');
    }
    
    echo "Preparing to query Supabase API...\n";
    
    // Query Supabase for active Maksekeskus configuration
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabase_url . '/rest/v1/maksekeskus_config?active=eq.true&select=*&limit=1');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_VERBOSE, true);
    $verbose = fopen('php://temp', 'w+');
    curl_setopt($ch, CURLOPT_STDERR, $verbose);
    
    // Print the URL we're connecting to
    echo "Connecting to: " . $supabase_url . "/rest/v1/maksekeskus_config?active=eq.true&select=*&limit=1\n";
    
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
    echo "cURL verbose log: " . $verboseLog . "\n";
    
    curl_close($ch);

    // Debug log
    echo 'Supabase API response status: ' . $status_code . ' (curl_errno: ' . $curl_errno . ")\n";
    if ($curl_errno) {
        echo 'cURL error: ' . $curl_error . "\n";
    }
    echo 'Response body length: ' . strlen($response) . "\n";
    echo 'Response body preview: ' . substr($response, 0, 100) . (strlen($response) > 100 ? '...' : '') . "\n";
    
    if ($status_code !== 200) {
        echo 'ERROR: Failed to fetch Maksekeskus configuration. Status code: ' . $status_code . "\n";
        echo 'Response: ' . $response . "\n";
        throw new Exception('Failed to fetch Maksekeskus configuration from Supabase');
    }
    
    $config = json_decode($response, true);
    
    echo 'JSON decode result: ' . (json_last_error() === JSON_ERROR_NONE ? 'SUCCESS' : 'FAILED - ' . json_last_error_msg()) . "\n";
    echo 'Config array: ' . (is_array($config) ? 'YES' : 'NO') . "\n";
    echo 'Config count: ' . (is_array($config) ? count($config) : 'N/A') . "\n";
    
    if (empty($config) || !is_array($config) || count($config) === 0) {
        echo "ERROR: No active Maksekeskus configuration found in Supabase\n";
        throw new Exception('No active Maksekeskus configuration found');
    }
    
    // Debug log
    echo "Maksekeskus config loaded successfully.\n";
    echo 'Shop ID: ' . ($config[0]['shop_id'] ?? 'N/A') . "\n";
    echo 'Test mode: ' . (isset($config[0]['test_mode']) && $config[0]['test_mode'] ? 'true' : 'false') . "\n";
    echo 'API keys present: ' . (isset($config[0]['api_secret_key']) && !empty($config[0]['api_secret_key']) ? 'YES' : 'NO') . "\n";
    echo "========== SUPABASE CONFIG LOADING COMPLETE ==========\n";
    
    return $config[0];
}