<?php
// Load environment variables
$dotenv_path = __DIR__ . '/../../../../.env';
if (file_exists($dotenv_path)) {
    $lines = file($dotenv_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        
        if (!empty($name)) {
            putenv("$name=$value");
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

// Load Composer autoloader
require_once __DIR__ . '/../vendor/autoload.php';

/**
 * Get Maksekeskus configuration from Supabase
 * 
 * @return array Configuration array with shop_id, api_secret_key, api_open_key, and test_mode
 */
function getMaksekeskusConfig() {
    try {
        // First try to get from environment variables
        $shop_id = $_ENV['MAKSEKESKUS_SHOP_ID'] ?? getenv('MAKSEKESKUS_SHOP_ID');
        $secret_key = $_ENV['MAKSEKESKUS_SECRET_KEY'] ?? getenv('MAKSEKESKUS_SECRET_KEY');
        $publishable_key = $_ENV['MAKSEKESKUS_PUBLISHABLE_KEY'] ?? getenv('MAKSEKESKUS_PUBLISHABLE_KEY');
        
        // If environment variables are set, use them
        if ($shop_id && $secret_key && $publishable_key) {
            return [
                'shop_id' => $shop_id,
                'api_secret_key' => $secret_key,
                'api_open_key' => $publishable_key,
                'test_mode' => ($_ENV['MAKSEKESKUS_TEST_MODE'] ?? getenv('MAKSEKESKUS_TEST_MODE')) === 'true'
            ];
        }
        
        // Otherwise, get from Supabase
        $supabase_url = $_ENV['VITE_SUPABASE_URL'] ?? getenv('VITE_SUPABASE_URL');
        $supabase_key = $_ENV['VITE_SUPABASE_SERVICE_ROLE_KEY'] ?? getenv('VITE_SUPABASE_SERVICE_ROLE_KEY');
        
        if (!$supabase_url || !$supabase_key) {
            throw new Exception('Supabase configuration is missing');
        }
        
        $supabaseService = new \PHPSupabase\Service($supabase_key, $supabase_url);
        $configDb = $supabaseService->initializeDatabase('maksekeskus_config', 'id');
        
        // Get active configuration
        $configDb->findBy('active', 'true');
        $config = $configDb->getFirstResult();
        
        if ($configDb->getError() || !isset($config->shop_id)) {
            throw new Exception('Failed to get Maksekeskus configuration: ' . $configDb->getError());
        }
        
        return [
            'shop_id' => $config->shop_id,
            'api_secret_key' => $config->api_secret_key,
            'api_open_key' => $config->api_open_key,
            'test_mode' => $config->test_mode
        ];
        
    } catch (Exception $e) {
        // Fallback to test credentials if available
        if (defined('MAKSEKESKUS_TEST_SHOP_ID') && defined('MAKSEKESKUS_TEST_SECRET_KEY') && defined('MAKSEKESKUS_TEST_PUBLISHABLE_KEY')) {
            return [
                'shop_id' => MAKSEKESKUS_TEST_SHOP_ID,
                'api_secret_key' => MAKSEKESKUS_TEST_SECRET_KEY,
                'api_open_key' => MAKSEKESKUS_TEST_PUBLISHABLE_KEY,
                'test_mode' => true
            ];
        }
        
        // Use the provided test credentials
        return [
            'shop_id' => 'f7741ab2-7445-45f9-9af4-0d0408ef1e4c',
            'api_secret_key' => 'pfOsGD9oPaFEILwqFLHEHkPf7vZz4j3t36nAcufP1abqT9l99koyuC1IWAOcBeqt',
            'api_open_key' => 'zPA6jCTIvGKYqrXxlgkXLzv3F82Mjv2E',
            'test_mode' => true
        ];
    }
}