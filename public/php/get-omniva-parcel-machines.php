<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/omniva_error.log');

// Set content type to JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Log file for debugging
$logFile = __DIR__ . '/omniva_parcel_machines_log.txt';

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

// Cache settings
$cacheFile = __DIR__ . '/omniva_locations_cache.json';
$cacheExpiry = 24 * 3600; // 24 hours in seconds - increased for zone.ee

// Get country from query parameter, default to 'ee' (Estonia)
$country = isset($_GET['country']) ? strtolower($_GET['country']) : 'ee';
$validCountries = ['ee', 'lv', 'lt', 'fi'];

if (!in_array($country, $validCountries)) {
    $country = 'ee'; // Default to Estonia if invalid country provided
}

try {
    // Check if we have a valid cache file
    $useCache = false;
    if (file_exists($cacheFile)) {
        $cacheTime = filemtime($cacheFile);
        if (time() - $cacheTime < $cacheExpiry) {
            $useCache = true;
        }
    }
    
    if ($useCache) {
        logMessage("Using cached parcel machine data");
        $locationsData = file_get_contents($cacheFile);
        $locations = json_decode($locationsData, true);
        
        // Log the total number of locations loaded from cache
        logMessage("Total locations loaded from cache", count($locations));
        
        // Log sample data to verify structure
        if (count($locations) > 0) {
            $sampleLocations = array_slice($locations, 0, 5);
            logMessage("Sample location data structure", array_map(function($loc) {
                return [
                    'A0_NAME' => $loc['A0_NAME'] ?? 'missing',
                    'TYPE' => $loc['TYPE'] ?? 'missing',
                    'NAME' => $loc['NAME'] ?? 'missing',
                    'ZIP' => $loc['ZIP'] ?? 'missing'
                ];
            }, $sampleLocations));
        }
        
        // Check if the cache is valid JSON
        if ($locations === null && json_last_error() !== JSON_ERROR_NONE) {
            logMessage("Cache file contains invalid JSON, fetching fresh data");
            $useCache = false;
        }
    } else {
        logMessage("Fetching fresh parcel machine data from Omniva API");
        
        // Fetch data from Omniva API - using locationsfull.json for more detailed data
        $apiUrl = 'https://www.omniva.ee/locationsfull.json';
        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30); // 30 seconds timeout
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

        // Log the total number of locations loaded from API
        logMessage("Total locations loaded from API", count($locations));
        
        // Log sample data to verify structure
        if (count($locations) > 0) {
            $sampleLocations = array_slice($locations, 0, 5);
            logMessage("Sample location data structure", array_map(function($loc) {
                return [
                    'A0_NAME' => $loc['A0_NAME'] ?? 'missing',
                    'TYPE' => $loc['TYPE'] ?? 'missing',
                    'NAME' => $loc['NAME'] ?? 'missing',
                    'ZIP' => $loc['ZIP'] ?? 'missing'
                ];
            }, $sampleLocations));
        }
        
        // Cache the response
        if (file_put_contents($cacheFile, $response)) {
            logMessage("Cached fresh parcel machine data", "Saved " . count($locations) . " locations");
            
            // Set proper permissions for zone.ee
            chmod($cacheFile, 0666);
        } else {
            logMessage("Failed to write cache file");
        }
    }
    
    // Filter locations by country and type (parcel machines only)
    // In locationsfull.json, TYPE=0 is for parcel machines
    $filteredLocations = array_filter($locations, function($location) use ($country) {
        $isMatch = isset($location['A0_NAME']) && 
               strtolower($location['A0_NAME']) === $country && 
               isset($location['TYPE']) && 
               $location['TYPE'] === 0; // TYPE 0 = PARCEL_MACHINE
        
        // For detailed debugging of the first few items
        static $debugCount = 0;
        if ($debugCount < 10) {
            logMessage("Filter check", [
                'country_match' => isset($location['A0_NAME']) && strtolower($location['A0_NAME']) === $country,
                'type_match' => isset($location['TYPE']) && $location['TYPE'] === 0,
                'A0_NAME' => $location['A0_NAME'] ?? 'missing',
                'TYPE' => $location['TYPE'] ?? 'missing',
                'is_match' => $isMatch
            ]);
            $debugCount++;
        }
        
        return isset($location['A0_NAME']) && 
               strtolower($location['A0_NAME']) === $country && 
               isset($location['TYPE']) && 
               $location['TYPE'] === 0; // TYPE 0 = PARCEL_MACHINE
    });
    
    // Log the number of locations after filtering
    logMessage("Locations after filtering", [
        'country' => $country,
        'total_before_filter' => count($locations),
        'total_after_filter' => count($filteredLocations)
    ]);
    
    // Reindex array to get sequential numeric keys
    $filteredLocations = array_values($filteredLocations);
    
    // Format the data for easier consumption by the frontend
    $formattedLocations = array_map(function($location) {
        return [
            'id' => $location['ZIP'],
            'name' => $location['NAME'],
            'address' => $location['A1_NAME'] . ', ' . $location['A2_NAME'] . ', ' . $location['A3_NAME'],
            'city' => $location['A1_NAME'],
            'county' => $location['A2_NAME'],
            'country' => $location['A0_NAME'],
            'coordinates' => [
                'latitude' => $location['Y_COORDINATE'],
                'longitude' => $location['X_COORDINATE']
            ],
            'serviceHours' => $location['SERVICE_HOURS'] ?? null
        ];
    }, $filteredLocations);
    
    // Sort by name
    usort($formattedLocations, function($a, $b) {
        return strcmp($a['name'], $b['name']);
    });
    
    logMessage("Returning " . count($formattedLocations) . " parcel machines for country: $country");
    
    echo json_encode([
        'success' => true,
        'country' => $country,
        'parcelMachines' => $formattedLocations
    ]);
    
} catch (Exception $e) {
    logMessage("Error", $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}