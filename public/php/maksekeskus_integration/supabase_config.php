<?php
// public/php/maksekeskus_integration/supabase_config.php

// Log environment variables for debugging
error_log("Looking for .env variables");
error_log("SUPABASE_URL exists: " . (isset($_ENV['SUPABASE_URL']) ? "YES" : "NO"));
error_log("SUPABASE_SERVICE_ROLE_KEY exists: " . (isset($_ENV['SUPABASE_SERVICE_ROLE_KEY']) ? "YES" : "NO"));

/**
 * Get Maksekeskus configuration from environment variables or fallback to test credentials
 * 
 * @return array Configuration array with shop_id, api_secret_key, api_open_key, and test_mode
 */
function getMaksekeskusConfig() {
    try {
        // First try to get from environment variables
        $shop_id = $_ENV['MAKSEKESKUS_SHOP_ID'] ?? null;
        $secret_key = $_ENV['MAKSEKESKUS_SECRET_KEY'] ?? null;
        $publishable_key = $_ENV['MAKSEKESKUS_PUBLISHABLE_KEY'] ?? null;
        $test_mode_env = $_ENV['MAKSEKESKUS_TEST_MODE'] ?? null;
        
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