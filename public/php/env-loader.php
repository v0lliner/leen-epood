<?php
/**
 * Environment variable loader
 * 
 * This file loads environment variables from .env file
 * It should be included at the beginning of PHP scripts that need environment variables
 */

// Load the Logger class if not already loaded
if (!class_exists('Logger')) {
    require_once __DIR__ . '/utils/Logger.php';
}

// Load the EnvLoader class if not already loaded
if (!class_exists('EnvLoader')) {
    require_once __DIR__ . '/utils/EnvLoader.php';
}

// Initialize logger
$envLogger = new Logger('EnvLoader', 'env_loader.log');

// Create and use the environment loader
$envLoader = new EnvLoader($envLogger);
$envLoader->load();

// Check for critical environment variables
$criticalVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'MAKSEKESKUS_SHOP_ID',
    'MAKSEKESKUS_PUBLIC_KEY',
    'MAKSEKESKUS_PRIVATE_KEY'
];

$missingVars = [];
foreach ($criticalVars as $var) {
    if (getenv($var) === false) {
        $missingVars[] = $var;
    }
}

if (!empty($missingVars)) {
    $envLogger->warning("Missing critical environment variables", [
        'missing' => $missingVars
    ]);
}

// Function to load environment variables from .env file
function loadEnvFile($path) {
    global $envLogger;
    
    if (!file_exists($path)) {
        $envLogger->warning("Env file not found", ['path' => $path]);
        return false;
    }
    
    $envLogger->info("Loading environment variables from", ['path' => $path]);
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // Parse line
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            
            // Remove quotes if present
            if (strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) {
                $value = substr($value, 1, -1);
            } elseif (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1) {
                $value = substr($value, 1, -1);
            }
            
            // Set environment variable
            putenv("$name=$value");
        }
    }
    
    return true;
}