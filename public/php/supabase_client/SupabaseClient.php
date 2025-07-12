<?php
// public/php/supabase_client/SupabaseClient.php

class SupabaseClient {
    private $baseUrl;
    private $apiKey;
    private $headers;

    public function __construct($baseUrl, $apiKey) {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->apiKey = $apiKey;
        $this->headers = [
            "apikey: {$this->apiKey}",
            "Authorization: Bearer {$this->apiKey}",
            "Content-Type: application/json"
        ];
        
        error_log("SupabaseClient initialized with URL: {$baseUrl}, Key length: " . strlen($apiKey));
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
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $this->headers);
        curl_setopt($ch, CURLOPT_FAILONERROR, false); // Don't fail on HTTP error codes
        curl_setopt($ch, CURLOPT_TIMEOUT, 30); // Set timeout to 30 seconds
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true); // Verify SSL certificate
        curl_setopt($ch, CURLOPT_VERBOSE, true); // Enable verbose output

        // Capture verbose output
        $verbose = fopen('php://temp', 'w+');
        curl_setopt($ch, CURLOPT_STDERR, $verbose);

        if ($data !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        $curlErrno = curl_errno($ch);

        // Get verbose information
        rewind($verbose);
        $verboseLog = stream_get_contents($verbose);
        fclose($verbose);

        error_log("Supabase response code: " . $httpCode);
        
        // Log detailed information for debugging
        if (function_exists('safeLog')) {
            safeLog('supabase_raw_responses.log', "Path: {$path}, Method: {$method}, HTTP Code: {$httpCode}, Response: " . $response);
            
            if ($curlError) {
                safeLog('supabase_curl_errors.log', "cURL Error ({$curlErrno}): {$curlError}\nVerbose log: {$verboseLog}");
            }
        } else {
            error_log("SupabaseClient: safeLog not found. Path: {$path}, Method: {$method}, HTTP Code: {$httpCode}");
            
            if ($curlError) {
                error_log("SupabaseClient cURL Error ({$curlErrno}): {$curlError}");
                error_log("SupabaseClient cURL Verbose: {$verboseLog}");
            }
        }

        if ($curlErrno) {
            error_log("Curl error: " . $curlError);
            throw new Exception('Curl error: ' . $curlError);
        }

        curl_close($ch);

        $decoded = json_decode($response);
        
        if ($httpCode >= 400) {
            error_log("Supabase API error (" . $httpCode . "): " . $response);
            
            // Provide more detailed error message
            $errorMsg = "Supabase API error ({$httpCode})";
            if ($decoded && isset($decoded->message)) {
                $errorMsg .= ": " . $decoded->message;
                
                if (isset($decoded->hint)) {
                    $errorMsg .= " - " . $decoded->hint;
                }
            } else {
                $errorMsg .= ": " . $response;
            }
            
            throw new Exception($errorMsg);
        }

        return $decoded;
    }
}