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

    public function getById($table, $id) {
        return $this->request("/rest/v1/{$table}?id=eq.{$id}&limit=1", 'GET');
    }

    private function request($path, $method, $data = null) {
        $url = $this->baseUrl . $path;
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $this->headers);

        if ($data !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            throw new Exception('Curl error: ' . curl_error($ch));
        }

        curl_close($ch);

        $decoded = json_decode($response);

        if ($httpCode >= 400) {
            throw new Exception("Supabase API error ({$httpCode}): " . $response);
        }

        return $decoded;
    }
}