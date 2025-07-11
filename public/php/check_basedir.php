<?php
// This file helps diagnose PHP open_basedir restrictions
header('Content-Type: text/plain');

echo "open_basedir: " . ini_get('open_basedir') . "\n";
echo "__DIR__: " . __DIR__ . "\n";
echo "realpath(__DIR__): " . realpath(__DIR__) . "\n";
echo ".env path attempt: " . realpath(__DIR__ . '/../../.env') . "\n";
echo "file_exists(.env path attempt): " . (file_exists(__DIR__ . '/../../.env') ? 'YES' : 'NO') . "\n";

// Check environment variables
echo "\nEnvironment Variables:\n";
echo "VITE_SUPABASE_URL from _ENV: " . (isset($_ENV['VITE_SUPABASE_URL']) ? 'SET' : 'NOT SET') . "\n";
echo "VITE_SUPABASE_URL from getenv(): " . (getenv('VITE_SUPABASE_URL') ? 'SET' : 'NOT SET') . "\n";
echo "VITE_SUPABASE_SERVICE_ROLE_KEY from _ENV: " . (isset($_ENV['VITE_SUPABASE_SERVICE_ROLE_KEY']) ? 'SET' : 'NOT SET') . "\n";
echo "VITE_SUPABASE_SERVICE_ROLE_KEY from getenv(): " . (getenv('VITE_SUPABASE_SERVICE_ROLE_KEY') ? 'SET' : 'NOT SET') . "\n";

// Check if .htaccess is working
echo "\nHTAccess Test:\n";
echo "TEST_ENV_VAR from _ENV: " . (isset($_ENV['TEST_ENV_VAR']) ? $_ENV['TEST_ENV_VAR'] : 'NOT SET') . "\n";
echo "TEST_ENV_VAR from getenv(): " . (getenv('TEST_ENV_VAR') ? getenv('TEST_ENV_VAR') : 'NOT SET') . "\n";