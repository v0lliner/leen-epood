<?php
/**
 * Get Omniva parcel machines
 * 
 * This endpoint returns a list of Omniva parcel machines for a given country.
 */

// Set headers
header('Content-Type: application/json');

// Get country from query parameters
$country = $_GET['country'] ?? 'ee';

try {
    // Initialize Omniva PickupPoints
    require_once __DIR__ . '/omniva/vendor/autoload.php';
    $pickupPoints = new \Mijora\Omniva\Locations\PickupPoints();
    
    // Get parcel machines for the specified country
    $parcelMachines = $pickupPoints->getFilteredLocations($country, 0);
    
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
    error_log('Error fetching Omniva parcel machines: ' . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}