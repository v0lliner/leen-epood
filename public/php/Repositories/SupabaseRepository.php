<?php
namespace Repositories;

/**
 * Supabase API client for PHP
 * 
 * Provides a consistent interface for interacting with Supabase
 * from PHP backend code.
 */
class SupabaseRepository {
    private $supabaseUrl;
    private $supabaseKey;
    private $logger;
    
    /**
     * Create a new Supabase client
     * 
     * @param string $supabaseUrl Supabase project URL
     * @param string $supabaseKey Supabase service role key
     * @param \Utils\Logger $logger Logger instance
     */
    public function __construct($supabaseUrl, $supabaseKey, $logger) {
        $this->supabaseUrl = $supabaseUrl;
        $this->supabaseKey = $supabaseKey;
        $this->logger = $logger;
        
        if (empty($this->supabaseUrl) || empty($this->supabaseKey)) {
            $this->logger->error("Supabase credentials missing", [
                'url_set' => !empty($this->supabaseUrl),
                'key_set' => !empty($this->supabaseKey)
            ]);
            throw new \Exception("Supabase credentials are required");
        }
    }
    
    /**
     * Make a request to the Supabase REST API
     * 
     * @param string $endpoint API endpoint (e.g., "/rest/v1/orders")
     * @param string $method HTTP method (GET, POST, PATCH, DELETE)
     * @param array $data Request data for POST/PATCH requests
     * @param array $params Query parameters
     * @return array Response with data and status
     */
    public function request($endpoint, $method = 'GET', $data = null, $params = null) {
        $url = $this->supabaseUrl . $endpoint;
        
        // Add query parameters if provided
        if ($params && is_array($params)) {
            $url .= '?' . http_build_query($params);
        }
        
        $this->logger->info("Making Supabase request", [
            'method' => $method,
            'endpoint' => $endpoint
        ]);
        
        $ch = curl_init($url);
        
        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->supabaseKey,
            'apikey: ' . $this->supabaseKey
        ];
        
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
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
            $this->logger->error("Supabase request failed", [
                'error' => $error,
                'status' => $statusCode
            ]);
            
            return [
                'error' => $error,
                'status' => $statusCode,
                'data' => null
            ];
        }
        
        $responseData = json_decode($response, true);
        
        if ($statusCode >= 400) {
            $this->logger->error("Supabase request returned error", [
                'status' => $statusCode,
                'response' => $responseData
            ]);
        } else {
            $this->logger->info("Supabase request successful", [
                'status' => $statusCode
            ]);
        }
        
        return [
            'data' => $responseData,
            'status' => $statusCode,
            'error' => null
        ];
    }
    
    /**
     * Get a record by ID
     * 
     * @param string $table Table name
     * @param string $id Record ID
     * @return array|null Record data or null if not found
     */
    public function getById($table, $id) {
        $result = $this->request("/rest/v1/{$table}", 'GET', null, [
            'id' => "eq.{$id}",
            'select' => '*'
        ]);
        
        if ($result['status'] === 200 && !empty($result['data'])) {
            return $result['data'][0];
        }
        
        return null;
    }
    
    /**
     * Get a record by a specific field value
     * 
     * @param string $table Table name
     * @param string $field Field name
     * @param string $value Field value
     * @return array|null Record data or null if not found
     */
    public function getByField($table, $field, $value) {
        $result = $this->request("/rest/v1/{$table}", 'GET', null, [
            $field => "eq.{$value}",
            'select' => '*'
        ]);
        
        if ($result['status'] === 200 && !empty($result['data'])) {
            return $result['data'][0];
        }
        
        return null;
    }
    
    /**
     * Insert a new record
     * 
     * @param string $table Table name
     * @param array $data Record data
     * @return array|null Inserted record or null on failure
     */
    public function insert($table, $data) {
        $result = $this->request("/rest/v1/{$table}", 'POST', $data, [
            'select' => '*'
        ]);
        
        if ($result['status'] === 201 && !empty($result['data'])) {
            return $result['data'][0];
        }
        
        return null;
    }
    
    /**
     * Update a record
     * 
     * @param string $table Table name
     * @param string $id Record ID
     * @param array $data Updated data
     * @return bool Success status
     */
    public function update($table, $id, $data) {
        $result = $this->request("/rest/v1/{$table}", 'PATCH', $data, [
            'id' => "eq.{$id}"
        ]);
        
        return $result['status'] === 204;
    }
    
    /**
     * Update a record by a specific field
     * 
     * @param string $table Table name
     * @param string $field Field name
     * @param string $value Field value
     * @param array $data Updated data
     * @return bool Success status
     */
    public function updateByField($table, $field, $value, $data) {
        $result = $this->request("/rest/v1/{$table}", 'PATCH', $data, [
            $field => "eq.{$value}"
        ]);
        
        return $result['status'] === 204;
    }
}