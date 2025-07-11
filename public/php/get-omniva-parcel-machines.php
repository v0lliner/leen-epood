<?php
/**
 * Get Omniva parcel machines
 * 
 * This endpoint returns a list of Omniva parcel machines for a given country.
 */

// Set headers
header('Content-Type: application/json');

// Enable error logging
ini_set('display_errors', 0); // Don't display errors to the client
ini_set('log_errors', 1); // Enable error logging
error_log('Omniva endpoint called with country: ' . ($_GET['country'] ?? 'ee'));

// Get country from query parameters
$country = $_GET['country'] ?? 'ee';

try {
    // Use the locations API directly - no need for SDK
    $locationsUrl = 'https://www.omniva.ee/locations.json';
    
    $response = false;
    $error_message = '';
    
    // Try file_get_contents first
    if (ini_get('allow_url_fopen')) {
        error_log('Trying to fetch Omniva data using file_get_contents');
        $context = stream_context_create([
            'http' => [
                'timeout' => 30,
                'user_agent' => 'Leen.ee Website/1.0'
            ]
        ]);
        $response = @file_get_contents($locationsUrl, false, $context);
        
        if ($response === false) {
            $error_message = 'file_get_contents failed: ' . (error_get_last()['message'] ?? 'Unknown error');
            error_log($error_message);
        }
    } else {
        error_log('allow_url_fopen is disabled, skipping file_get_contents');
    }
    
    // If file_get_contents failed or is disabled, try cURL
    if ($response === false && function_exists('curl_init')) {
        error_log('Trying to fetch Omniva data using cURL');
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $locationsUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Leen.ee Website/1.0');
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Sometimes needed on shared hosting
        
        $response = curl_exec($ch);
        
        if ($response === false) {
            $error_message .= ' cURL error: ' . curl_error($ch);
            error_log($error_message);
        }
        
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        error_log('cURL HTTP code: ' . $http_code);
        
        curl_close($ch);
    } else if ($response === false) {
        error_log('Both file_get_contents and cURL are unavailable');
    }
    
    if ($response === false) {
        throw new Exception('Failed to fetch data from Omniva API: ' . $error_message);
    }
    
    $allLocations = json_decode($response, true);
    
    if (!$allLocations || !is_array($allLocations)) {
        $json_error = json_last_error_msg();
        error_log('JSON decode error: ' . $json_error);
        error_log('Response preview: ' . substr($response, 0, 200));
        throw new Exception('Invalid response format from Omniva API: ' . $json_error);
    }
    
    error_log('Successfully parsed JSON, found ' . count($allLocations) . ' locations');
    
    // Filter locations by country and type (0 = parcel machines)
    $parcelMachines = array_filter($allLocations, function($location) use ($country) {
        return strtolower($location['A0_NAME']) === strtolower($country) && $location['TYPE'] === '0';
    });
    
    error_log('Filtered to ' . count($parcelMachines) . ' parcel machines for country: ' . $country);
    
    // Format the response
    $formattedMachines = [];
    foreach ($parcelMachines as $machine) {
        $formattedMachines[] = [
            'id' => $machine['ZIP'],
            'name' => $machine['NAME'] . ' - ' . $machine['A2_NAME'] . ', ' . $machine['A0_NAME'],
            'address' => $machine['A2_NAME'] . ', ' . $machine['A1_NAME'],
            'city' => $machine['A2_NAME'],
            'country' => $machine['A0_NAME'],
            'zip' => $machine['ZIP'],
            'type' => $machine['TYPE']
        ];
    }
    
    // Sort by name
    usort($formattedMachines, function($a, $b) {
        return strcmp($a['name'], $b['name']);
    });
    
    // Return success response
    echo json_encode([
        'success' => true,
        'parcelMachines' => $formattedMachines
    ]);
    
} catch (Exception $e) {
    // Log detailed error
    error_log('ERROR fetching Omniva parcel machines: ' . $e->getMessage());
    error_log('Trace: ' . $e->getTraceAsString());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to retrieve parcel machines. Please try again later.'
    ]);
}