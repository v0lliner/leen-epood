<?php
// public/php/maksekeskus_integration/supabase_config.php

// Load environment variables
$dotenv_path = __DIR__ . '/../../../.env';
error_log("Looking for .env file at: " . $dotenv_path . " - exists: " . (file_exists($dotenv_path) ? "YES" : "NO"));
// We don't need to read .env file because Apache sets environment variables via .htaccess
// Just log what we have in $_SERVER
error_log("Available in _SERVER: " . implode(", ", array_keys($_SERVER)));

/**
 * Get Maksekeskus configuration from environment variables or fallback to test credentials
 * 
 * @return array Configuration array with shop_id, api_secret_key, api_open_key, and test_mode
 */
function getMaksekeskusConfig() {
    try {
        // First try to get from environment variables
        $shop_id = $_SERVER['MAKSEKESKUS_SHOP_ID'] ?? $_ENV['MAKSEKESKUS_SHOP_ID'] ?? getenv('MAKSEKESKUS_SHOP_ID');
        $secret_key = $_SERVER['MAKSEKESKUS_SECRET_KEY'] ?? $_ENV['MAKSEKESKUS_SECRET_KEY'] ?? getenv('MAKSEKESKUS_SECRET_KEY');
        $publishable_key = $_SERVER['MAKSEKESKUS_PUBLISHABLE_KEY'] ?? $_ENV['MAKSEKESKUS_PUBLISHABLE_KEY'] ?? getenv('MAKSEKESKUS_PUBLISHABLE_KEY');
        $test_mode_env = $_SERVER['MAKSEKESKUS_TEST_MODE'] ?? $_ENV['MAKSEKESKUS_TEST_MODE'] ?? getenv('MAKSEKESKUS_TEST_MODE');
        
        // If environment variables are set, use them
        if ($shop_id && $secret_key && $publishable_key) {
            return [
                'shop_id' => $shop_id,
                'api_secret_key' => $secret_key,
                'api_open_key' => $publishable_key,
                'test_mode' => ($test_mode_env === 'true' || $test_mode_env === true)
            ];
        }
        
        // Fallback to hardcoded test credentials if .env is not found or incomplete
        return [
            'shop_id' => 'f7741ab2-7445-45f9-9af4-0d0408ef1e4c',
            'api_secret_key' => 'pfOsGD9oPaFEILwqFLHEHkPf7vZz4j3t36nAcufP1abqT9l99koyuC1IWAOcBeqt',
            'api_open_key' => 'zPA6jCTIvGKYqrXxlgkXLzv3F82Mjv2E',
            'test_mode' => true
        ];
        
    } catch (Exception $e) {
        // Log the error if Supabase connection fails, but still provide fallback credentials
        error_log('Error getting Maksekeskus config: ' . $e->getMessage());
        
        // Fallback to hardcoded test credentials
        return [
            'shop_id' => 'f7741ab2-7445-45f9-9af4-0d0408ef1e4c',
            'api_secret_key' => 'pfOsGD9oPaFEILwqFLHEHkPf7vZz4j3t36nAcufP1abqT9l99koyuC1IWAOcBeqt',
            'api_open_key' => 'zPA6jCTIvGKYqrXxlgkXLzv3F82Mjv2E',
            'test_mode' => true
        ];
    }
}