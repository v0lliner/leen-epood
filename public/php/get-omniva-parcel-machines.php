<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them

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
$cacheExpiry = 6 * 3600; // 6 hours in seconds

// Get country from query parameter, default to 'ee' (Estonia)
$country = isset($_GET['country']) ? strtolower($_GET['country']) : 'ee';
$validCountries = ['ee', 'lv', 'lt', 'fi'];

// Log the received country parameter
logMessage("Received country parameter: " . $country);

if (!in_array($country, $validCountries)) {
    logMessage("Invalid country code provided: " . $country . ". Defaulting to 'ee'");
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
        $locations = json_decode($locationsData, true) ?: [];
        logMessage("Loaded " . count($locations) . " locations from cache");
    } else {
        logMessage("Fetching fresh parcel machine data from Omniva API");
        
        // Fetch data from Omniva API
        $apiUrl = 'https://www.omniva.ee/locations.json';
        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10); // 10 seconds timeout
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
        } else {
            logMessage("Received " . count($locations) . " locations from Omniva API");
        }
        
        // Cache the response
        file_put_contents($cacheFile, $response);
        logMessage("Cached fresh parcel machine data");
    }
    
    // Filter locations by country and type (parcel machines only)
    $filteredLocations = array_filter($locations, function($location) use ($country) {
        return isset($location['A0_NAME']) && 
               strtolower($location['A0_NAME']) === strtolower($country) && 
               isset($location['TYPE']) && 
               $location['TYPE'] === 'PARCEL_MACHINE';
    });
    
    logMessage("Filtered to " . count($filteredLocations) . " parcel machines for country: " . $country);
    
    // Reindex array to get sequential numeric keys
    $filteredLocations = array_values($filteredLocations);
    
    // Format the data for easier consumption by the frontend
    $formattedLocations = array_map(function($location) {
        // Ensure all required fields exist to avoid undefined index errors
        $a1Name = isset($location['A1_NAME']) ? $location['A1_NAME'] : '';
        $a2Name = isset($location['A2_NAME']) ? $location['A2_NAME'] : '';
        $a3Name = isset($location['A3_NAME']) ? $location['A3_NAME'] : '';
        $yCoord = isset($location['Y_COORDINATE']) ? $location['Y_COORDINATE'] : '';
        $xCoord = isset($location['X_COORDINATE']) ? $location['X_COORDINATE'] : '';
        
        return [
            'id' => $location['ZIP'],
            'name' => $location['NAME'],
            'address' => $a1Name . ', ' . $a2Name . ', ' . $a3Name,
            'city' => $a1Name,
            'county' => $a2Name,
            'country' => $location['A0_NAME'],
            'coordinates' => [
                'latitude' => $yCoord,
                'longitude' => $xCoord
            ]
        ];
    }, $filteredLocations);
    
    logMessage("Returning " . count($formattedLocations) . " formatted parcel machines");
    
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