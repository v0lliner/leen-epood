<?php
// Shared Supabase configuration helper for Maksekeskus integration

// Function to get Maksekeskus configuration from Supabase
function getMaksekeskusConfig() {
    // Load Supabase environment variables
    $env_file = __DIR__ . '/../../../.env';
    if (file_exists($env_file)) {
        $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                list($key, $value) = explode('=', $line, 2);
                $_ENV[trim($key)] = trim($value);
            }
        }
    }
    
    // Get Supabase credentials
    $supabase_url = $_ENV['VITE_SUPABASE_URL'] ?? '';
    $supabase_key = $_ENV['VITE_SUPABASE_SERVICE_ROLE_KEY'] ?? '';
    
    if (!$supabase_url || !$supabase_key) {
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
    
    if ($status_code !== 200) {
        throw new Exception('Failed to fetch Maksekeskus configuration from Supabase');
    }
    
    $config = json_decode($response, true);
    
    if (empty($config) || !is_array($config) || count($config) === 0) {
        throw new Exception('No active Maksekeskus configuration found');
    }
    
    return $config[0];
}