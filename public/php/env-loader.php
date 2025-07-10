<?php
/**
 * Environment variable loader
 * 
 * This file loads environment variables from .env file
 * It should be included at the beginning of PHP scripts that need environment variables
 */

// Function to load environment variables from .env file
function loadEnvFile($path) {
    if (!file_exists($path)) {
        error_log("Warning: .env file not found at $path");
        return false;
    }
    
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

// Try to load .env file from project root
$envPaths = [
    __DIR__ . '/../../../.env',  // One level up from project root
    __DIR__ . '/../../.env',     // Project root
    __DIR__ . '/../.env'         // PHP directory
];

$loaded = false;
foreach ($envPaths as $envPath) {
    if (loadEnvFile($envPath)) {
        error_log("Successfully loaded environment variables from $envPath");
        $loaded = true;
        break;
    }
}

// Check if critical environment variables are set
$criticalVars = ['SUPABASE_SERVICE_ROLE_KEY', 'MAKSEKESKUS_SHOP_ID', 'MAKSEKESKUS_PUBLIC_KEY', 'MAKSEKESKUS_PRIVATE_KEY'];
$missingVars = [];

foreach ($criticalVars as $var) {
    if (!getenv($var)) {
        $missingVars[] = $var;
    }
}

if (!empty($missingVars)) {
    error_log("Warning: Missing critical environment variables: " . implode(', ', $missingVars));
}