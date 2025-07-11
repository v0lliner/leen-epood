<?php
// Load PHPSupabase SDK with Composer autoloader
require_once __DIR__ . '/../phpsupabase/vendor/autoload.php';

/**
 * Get Maksekeskus configuration from Supabase
 * 
 * @return array Configuration array with shop_id, api_secret_key, api_open_key, test_mode
 */
function getMaksekeskusConfig() {
    // Load environment variables
    $supabase_url = $_ENV['VITE_SUPABASE_URL'] ?? getenv('VITE_SUPABASE_URL');
    $supabase_key = $_ENV['VITE_SUPABASE_SERVICE_ROLE_KEY'] ?? getenv('VITE_SUPABASE_SERVICE_ROLE_KEY');
    
    if (!$supabase_url || !$supabase_key) {
        // Fallback to test credentials if environment variables are not available
        return [
            'shop_id' => 'f7741ab2-7445-45f9-af4-0d0408ef1e4c',
            'api_secret_key' => 'pfOsGD9oPaFEILwqFLHEHkPf7vZz4j3t36nAcufP1abqT9l99koyuC1IWAOcBeqt',
            'api_open_key' => 'zPA6jCTIvGKYqrXxlgkXLzv3F82Mjv2E',
            'test_mode' => true
        ];
    }
    
    try {
        // Initialize Supabase service
        $supabaseService = new \PHPSupabase\Service($supabase_key, $supabase_url);
        
        // Initialize database client for maksekeskus_config table
        $db = $supabaseService->initializeDatabase('maksekeskus_config', 'id');
        
        // Find active configuration
        $db->findBy('active', 'true');
        $result = $db->getResult();
        
        if (empty($result)) {
            // Fallback to test credentials if no active configuration found
            return [
                'shop_id' => 'f7741ab2-7445-45f9-af4-0d0408ef1e4c',
                'api_secret_key' => 'pfOsGD9oPaFEILwqFLHEHkPf7vZz4j3t36nAcufP1abqT9l99koyuC1IWAOcBeqt',
                'api_open_key' => 'zPA6jCTIvGKYqrXxlgkXLzv3F82Mjv2E',
                'test_mode' => true
            ];
        }
        
        return (array)$result[0];
    } catch (\Exception $e) {
        // Log error
        error_log('Failed to fetch Maksekeskus configuration: ' . $e->getMessage());
        
        // Fallback to test credentials
        return [
            'shop_id' => 'f7741ab2-7445-45f9-af4-0d0408ef1e4c',
            'api_secret_key' => 'pfOsGD9oPaFEILwqFLHEHkPf7vZz4j3t36nAcufP1abqT9l99koyuC1IWAOcBeqt',
            'api_open_key' => 'zPA6jCTIvGKYqrXxlgkXLzv3F82Mjv2E',
            'test_mode' => true
        ];
    }
}