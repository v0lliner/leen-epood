<?php
/**
 * Script to update Omniva parcel machine locations cache
 * This script should be run via cron job on zone.ee
 * 
 * Example cron job (daily at 3 AM):
 * 0 3 * * * php /path/to/your/public/php/update-omniva-locations.php
 */

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/omniva_cron_error.log');

// Log file for debugging
$logFile = __DIR__ . '/omniva_cron_log.txt';

// Function to log messages
function logMessage($message, $data = null) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "$timestamp - $message";
    
    if ($data !== null) {
        $logEntry .= ": " . (is_string($data) ? $data : json_encode($data));
    }
    
    file_put_contents($logFile, $logEntry . "\n", FILE_APPEND);
}

// Cache file path
$cacheFile = __DIR__ . '/omniva_locations_cache.json';

try {
    logMessage("Starting Omniva locations update");
    
    // Fetch data from Omniva API - using locationsfull.json for more detailed data
    $apiUrl = 'https://www.omniva.ee/locationsfull.json';
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60); // 60 seconds timeout for large file
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    if ($error) {
        throw new Exception("cURL Error: $error");
    }
    
    if ($httpCode !== 200) {
        throw new Exception("API returned HTTP code $httpCode");
    }
    
    $locations = json_decode($response, true);
    
    if (!$locations || !is_array($locations)) {
        throw new Exception("Invalid response from Omniva API");
    }
    
    // Count parcel machines by country
    $countryStats = [];
    foreach ($locations as $location) {
        if (isset($location['TYPE']) && $location['TYPE'] === 0 && isset($location['A0_NAME'])) {
            $country = strtoupper($location['A0_NAME']);
            if (!isset($countryStats[$country])) {
                $countryStats[$country] = 0;
            }
            $countryStats[$country]++;
        }
    }
    
    // Cache the response
    if (file_put_contents($cacheFile, $response)) {
        logMessage("Successfully updated Omniva locations cache", [
            "Total locations" => count($locations),
            "Parcel machines by country" => $countryStats
        ]);
        
        // Set proper permissions for zone.ee
        chmod($cacheFile, 0666);
    } else {
        throw new Exception("Failed to write cache file");
    }
    
    echo "Omniva locations cache updated successfully.\n";
    
} catch (Exception $e) {
    logMessage("Error updating Omniva locations", $e->getMessage());
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}