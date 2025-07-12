<?php
// public/php/supabase_client/SupabaseClient.php

class SupabaseClient {
    private $baseUrl;
    private $apiKey;
    private $headers;
    private $isServiceRole = false;

    public function __construct($baseUrl, $apiKey, $isServiceRole = false) {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->apiKey = $apiKey;
        $this->isServiceRole = $isServiceRole;
        
        // Set appropriate headers based on key type
        $this->headers = [
            "apikey: {$this->apiKey}",
            "Authorization: Bearer {$this->apiKey}",
            "Content-Type: application/json"
        ];
        
        error_log("SupabaseClient initialized with URL: {$baseUrl}, Key type: " . 
            ($isServiceRole ? "service_role" : "anon") . ", Key length: " . strlen($apiKey));
    }

    public function insert($table, $data) {
        return $this->request("/rest/v1/{$table}", 'POST', $data);
    }

    public function update($table, $id, $data) {
        return $this->request("/rest/v1/{$table}?id=eq.{$id}", 'PATCH', $data);
    }

    public function get($table, $filters = '') {
        $url = "/rest/v1/{$table}" . ($filters ? "?{$filters}" : '');
        return $this->request($url, 'GET');
    }

    private function request($path, $method, $data = null) {
        $url = $this->baseUrl . $path;
        error_log("Supabase request: " . $method . " " . $url);
        error_log("Supabase headers: " . print_r($this->headers, true));
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $this->headers);

        if ($data !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        error_log("Supabase response code: " . $httpCode);
        error_log("Supabase request URL: " . $url);
        
        // Log raw response and HTTP code for debugging
        if (function_exists('safeLog')) {
            safeLog('supabase_raw_responses.log', "Path: {$path}, Method: {$method}, HTTP Code: {$httpCode}, Response: " . $response);
        } else {
            error_log("SupabaseClient: safeLog not found. Path: {$path}, Method: {$method}, HTTP Code: {$httpCode}, Response: " . $response);
        }

        if (curl_errno($ch)) {
            error_log("Curl error: " . curl_error($ch));
            throw new Exception('Curl error: ' . curl_error($ch));
        }

        curl_close($ch);

        $decoded = json_decode($response);
        
        if ($httpCode >= 400) {
            $errorMsg = "Supabase API error ({$httpCode}): " . $response;
            error_log($errorMsg);
            
            // Specific handling for RLS policy violations (403 Forbidden)
            if ($httpCode === 403) {
                error_log("CRITICAL: RLS policy violation detected. This might be due to:");
                error_log("1. Missing or incorrect RLS policies on the '{$table}' table");
                error_log("2. Using anon key instead of service_role key for admin operations");
                error_log("3. The service_role key not being properly passed in the Authorization header");
                
                if (!$this->isServiceRole) {
                    error_log("WARNING: You're using an anon key for an operation that might require service_role privileges");
                }
            }
            
            throw new Exception($errorMsg);
        }

        return $decoded;
    }
    
    // Helper method to check if RLS is enabled for a table
    public function isRlsEnabled($table) {
        try {
            $query = "SELECT relrowsecurity FROM pg_class WHERE relname = '{$table}'";
            $url = $this->baseUrl . "/rest/v1/rpc/execute_sql";
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['sql' => $query]));
            curl_setopt($ch, CURLOPT_HTTPHEADER, $this->headers);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode === 200) {
                $result = json_decode($response, true);
                return isset($result[0]['relrowsecurity']) && $result[0]['relrowsecurity'] === true;
            }
            
            return null; // Unable to determine
        } catch (Exception $e) {
            error_log("Error checking RLS status: " . $e->getMessage());
            return null;
        }
    }
}