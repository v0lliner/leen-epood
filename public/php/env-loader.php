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
$envPath = __DIR__ . '/../../.env';
$loaded = loadEnvFile($envPath);

if (!$loaded) {
    // Log that .env file was not found
    error_log("Warning: .env file not found at $envPath");
}