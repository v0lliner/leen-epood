<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them

// Log file for debugging
$logFile = __DIR__ . '/omniva_update_log.txt';

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

// Function to connect to Supabase via REST API
function supabaseRequest($endpoint, $method = 'GET', $data = null) {
    $supabaseUrl = 'https://epcenpirjkfkgdgxktrm.supabase.co';
    $supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY2VucGlyamtma2dkZ3hrdHJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExMzgwNCwiZXhwIjoyMDY2Njg5ODA0fQ.VQgOh4VmI0hmyXawVt0-uOmMFgHXkqhkMFQxBLjjQME';
    
    $url = $supabaseUrl . $endpoint;
    
    $ch = curl_init($url);
    
    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $supabaseKey,
        'apikey: ' . $supabaseKey
    ];
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    } else if ($method === 'PATCH' || $method === 'PUT') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    } else if ($method === 'DELETE') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    }
    
    $response = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    if ($error) {
        logMessage("cURL Error", $error);
        return ['error' => $error, 'status' => $statusCode];
    }
    
    return [
        'data' => json_decode($response, true),
        'status' => $statusCode
    ];
}

// Cache settings
$cacheFile = __DIR__ . '/omniva_locations_cache.json';
$cacheExpiry = 24 * 3600; // 24 hours in seconds

try {
    logMessage("Starting Omniva locations update");
    
    // Check if we have a valid cache file
    $useCache = false;
    if (file_exists($cacheFile)) {
        $cacheTime = filemtime($cacheFile);
        if (time() - $cacheTime < $cacheExpiry) {
            $useCache = true;
        }
    }
    
    $locationsData = null;
    
    if ($useCache) {
        logMessage("Using cached Omniva locations data");
        $locationsData = file_get_contents($cacheFile);
        $locations = json_decode($locationsData, true);
    } else {
        logMessage("Fetching fresh Omniva locations data");
        
        // Fetch data from Omniva API
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
        
        // Cache the response
        file_put_contents($cacheFile, $response);
        logMessage("Cached fresh Omniva locations data");
    }
    
    // Filter locations to only include parcel machines (TYPE = 0)
    // and only include locations from EE, LV, LT, FI
    $validCountries = ['EE', 'LV', 'LT', 'FI'];
    $parcelMachines = [];
    $validZips = [];
    
    foreach ($locations as $location) {
        if (isset($location['TYPE']) && $location['TYPE'] === '0' && 
            isset($location['A0_NAME']) && in_array($location['A0_NAME'], $validCountries)) {
            
            $parcelMachines[] = [
                'zip' => $location['ZIP'],
                'name' => $location['NAME'],
                'country' => $location['A0_NAME'],
                'county' => $location['A1_NAME'] ?? null,
                'city' => $location['A2_NAME'] ?? null,
                'district' => $location['A3_NAME'] ?? null,
                'coordinates' => json_encode([
                    'latitude' => $location['Y_COORDINATE'] ?? null,
                    'longitude' => $location['X_COORDINATE'] ?? null
                ])
            ];
            
            $validZips[] = $location['ZIP'];
        }
    }
    
    logMessage("Filtered " . count($parcelMachines) . " parcel machines from " . count($locations) . " locations");
    
    if (count($parcelMachines) === 0) {
        throw new Exception("No valid parcel machines found in the data");
    }
    
    // Upsert parcel machines to Supabase
    $batchSize = 100; // Process in batches to avoid request size limits
    $batches = array_chunk($parcelMachines, $batchSize);
    
    $totalUpserted = 0;
    
    foreach ($batches as $index => $batch) {
        logMessage("Processing batch " . ($index + 1) . " of " . count($batches));
        
        $result = supabaseRequest(
            "/rest/v1/omniva_parcel_machines",
            'POST',
            $batch
        );
        
        if (isset($result['error'])) {
            logMessage("Error upserting batch " . ($index + 1), $result['error']);
        } else {
            $totalUpserted += count($batch);
            logMessage("Successfully upserted batch " . ($index + 1));
        }
    }
    
    logMessage("Upserted $totalUpserted parcel machines");
    
    // Delete parcel machines that are no longer in the Omniva data
    // Only do this if we have valid data (to avoid wiping the table on API failure)
    if (count($validZips) > 0) {
        // Split into chunks to avoid URL length limits
        $zipChunks = array_chunk($validZips, 100);
        $totalDeleted = 0;
        
        foreach ($zipChunks as $index => $zipChunk) {
            $zipList = implode("','", array_map(function($zip) {
                return str_replace("'", "''", $zip); // Escape single quotes
            }, $zipChunk));
            
            $deleteEndpoint = "/rest/v1/omniva_parcel_machines?zip=not.in.(" . urlencode("'" . $zipList . "'") . ")";
            
            $result = supabaseRequest($deleteEndpoint, 'DELETE');
            
            if (isset($result['error'])) {
                logMessage("Error deleting outdated parcel machines (chunk " . ($index + 1) . ")", $result['error']);
            } else {
                $deletedCount = isset($result['data']) ? count($result['data']) : 0;
                $totalDeleted += $deletedCount;
                logMessage("Deleted $deletedCount outdated parcel machines (chunk " . ($index + 1) . ")");
            }
        }
        
        logMessage("Total deleted: $totalDeleted outdated parcel machines");
    } else {
        logMessage("Skipping deletion step due to empty valid ZIPs list");
    }
    
    logMessage("Omniva locations update completed successfully");
    
} catch (Exception $e) {
    logMessage("Exception occurred during update", $e->getMessage());
}