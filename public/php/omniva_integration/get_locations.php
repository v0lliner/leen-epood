<?php
// public/php/omniva_integration/get_locations.php

header('Content-Type: application/json');

$countryCode = $_GET['country'] ?? 'ee'; // Default to 'ee' if not specified

// Map frontend country codes to Omniva expected format
$countryMap = [
    'ee' => 'EE',
    'fi' => 'FI',
    'lv' => 'LV',
    'lt' => 'LT',
    'EE' => 'EE',
    'FI' => 'FI',
    'LV' => 'LV',
    'LT' => 'LT'
];

$omnivaCountryCode = $countryMap[strtolower($countryCode)] ?? 'EE'; // Use mapped code or default to 'EE'

$omnivaApiUrl = 'https://omniva.ee/locationsfull.json';

try {
    // Load JSON data directly
    $json_data = file_get_contents($omnivaApiUrl);

    if ($json_data === false) {
        throw new Exception('Failed to load data from Omniva API.');
    }

    $allLocations = json_decode($json_data, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Failed to decode JSON data from Omniva API: ' . json_last_error_msg());
    }

    $filteredLocations = [];
    foreach ($allLocations as $location) {
        // Filter by country code (field 'A0_NAME' in JSON)
        if (isset($location['A0_NAME']) && $location['A0_NAME'] === $omnivaCountryCode) {
            // Add only 'NAME' field and unique ID (using ZIP code for simplicity)
            $filteredLocations[] = [
                'id' => $location['ZIP'], // Use ZIP code as ID
                'name' => $location['NAME']
            ];
        }
    }

    // Sort by name for better user experience
    usort($filteredLocations, function($a, $b) {
        return strcmp($a['name'], $b['name']);
    });

    echo json_encode(['success' => true, 'parcelMachines' => $filteredLocations]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>