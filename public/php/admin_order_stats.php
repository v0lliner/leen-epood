<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if it's a GET request
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Load environment variables from .env file
$env = parse_ini_file(__DIR__ . '/../../.env');
if (!$env) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to load environment variables']);
    exit();
}

// Get Supabase credentials from environment variables
$supabaseUrl = $env['VITE_SUPABASE_URL'] ?? null;
$supabaseServiceKey = $env['SUPABASE_SERVICE_ROLE_KEY'] ?? null;

if (!$supabaseUrl || !$supabaseServiceKey) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Missing Supabase credentials']);
    exit();
}

// Include Httpful library
require_once __DIR__ . '/maksekeskus/vendor/autoload.php';
use Httpful\Request;

try {
    // Fetch order stats from Supabase
    $response = Request::get("$supabaseUrl/rest/v1/admin_order_stats")
        ->addHeader('apikey', $supabaseServiceKey)
        ->addHeader('Authorization', "Bearer $supabaseServiceKey")
        ->expectsJson()
        ->send();
    
    if ($response->code !== 200) {
        throw new Exception("Supabase API error: " . $response->raw_body);
    }
    
    // Get the first row of stats (there should only be one row)
    $stats = $response->body;
    
    if (empty($stats) || !is_array($stats) || count($stats) === 0) {
        // If no stats found, return empty stats
        echo json_encode([
            'success' => true,
            'stats' => [
                'total' => 0,
                'pending' => 0,
                'paid' => 0,
                'processing' => 0,
                'shipped' => 0,
                'completed' => 0,
                'cancelled' => 0,
                'refunded' => 0,
                'total_revenue' => 0,
                'confirmed_revenue' => 0
            ]
        ]);
        exit();
    }
    
    // Return the stats
    echo json_encode([
        'success' => true,
        'stats' => $stats[0]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch order stats: ' . $e->getMessage()
    ]);
}