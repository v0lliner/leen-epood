<?php
/**
 * Get Omniva parcel machines - extremely simplified version
 */

// Set headers
header('Content-Type: application/json');

// Get country from query parameters
$country = strtolower($_GET['country'] ?? 'ee');

// Log the request
error_log("Omniva endpoint called with country: $country");

try {
    // Always use the locationsfull.json endpoint as documented
    $locationsUrl = 'https://www.omniva.ee/locationsfull.json';
    
    // Fetch the data
    $response = file_get_contents($locationsUrl);
    
    if ($response === false) {
        throw new Exception("Failed to fetch data from Omniva API");
    }
    
    // Parse the JSON
    $allLocations = json_decode($response, true);
    
    if (!$allLocations || !is_array($allLocations)) {
        throw new Exception("Invalid response format from Omniva API");
    }
    
    // Filter locations by country and type (0 = parcel machines)
    $parcelMachines = array_values(array_filter($allLocations, function($location) use ($country) {
        return strtolower($location['A0_NAME']) === $country && $location['TYPE'] === '0';
    }));
    
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
    // Log error
    error_log('ERROR fetching Omniva parcel machines: ' . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to retrieve parcel machines. Please try again later.'
    ]);
}