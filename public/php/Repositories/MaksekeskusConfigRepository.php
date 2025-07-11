<?php
namespace Repositories;

/**
 * Repository for Maksekeskus configuration
 */
class MaksekeskusConfigRepository {
    private $supabase;
    private $logger;
    
    /**
     * Create a new Maksekeskus config repository
     * 
     * @param \Repositories\SupabaseRepository $supabase Supabase client
     * @param \Utils\Logger $logger Logger instance
     */
    public function __construct($supabase, $logger) {
        $this->supabase = $supabase;
        $this->logger = $logger;
    }
    
    /**
     * Get active Maksekeskus configuration
     * 
     * @return array|null Configuration or null if not found
     */
    public function getActiveConfig() {
        $this->logger->info("Getting active Maksekeskus configuration");
        
        $result = $this->supabase->request("/rest/v1/maksekeskus_config", 'GET', null, [
            'active' => "eq.true",
            'select' => '*'
        ]);
        
        if ($result['status'] === 200 && !empty($result['data'])) {
            return $result['data'][0];
        }
        
        $this->logger->warning("No active Maksekeskus configuration found");
        return null;
    }
    
    /**
     * Get masked configuration for display in admin UI
     * 
     * @return array|null Masked configuration or null if not found
     */
    public function getMaskedConfig() {
        $this->logger->info("Getting masked Maksekeskus configuration");
        
        $result = $this->supabase->request("/rest/v1/admin_payment_config_view", 'GET', null, [
            'select' => '*'
        ]);
        
        if ($result['status'] === 200 && !empty($result['data'])) {
            return $result['data'][0];
        }
        
        $this->logger->warning("No masked Maksekeskus configuration found");
        return null;
    }
    
    /**
     * Create or update Maksekeskus configuration
     * 
     * @param array $configData Configuration data
     * @return array|null Updated configuration or null on failure
     */
    public function upsertConfig($configData) {
        $this->logger->info("Upserting Maksekeskus configuration", [
            'id' => $configData['id'] ?? 'new'
        ]);
        
        // If setting this config as active, deactivate all others first
        if (isset($configData['active']) && $configData['active']) {
            $this->supabase->request("/rest/v1/maksekeskus_config", 'PATCH', [
                'active' => false
            ], [
                'active' => "eq.true"
            ]);
        }
        
        $result = $this->supabase->request("/rest/v1/maksekeskus_config", 'POST', $configData, [
            'select' => '*'
        ]);
        
        if ($result['status'] === 201 && !empty($result['data'])) {
            return $result['data'][0];
        }
        
        $this->logger->error("Failed to upsert Maksekeskus configuration", [
            'status' => $result['status'],
            'error' => $result['error'] ?? 'unknown'
        ]);
        
        return null;
    }
    
    /**
     * Toggle test mode for a configuration
     * 
     * @param string $id Configuration ID
     * @param bool $testMode New test mode value
     * @return bool Success status
     */
    public function toggleTestMode($id, $testMode) {
        $this->logger->info("Toggling test mode for Maksekeskus configuration", [
            'id' => $id,
            'test_mode' => $testMode ? 'true' : 'false'
        ]);
        
        $result = $this->supabase->update('maksekeskus_config', $id, [
            'test_mode' => $testMode
        ]);
        
        return $result;
    }
    
    /**
     * Toggle active status for a configuration
     * 
     * @param string $id Configuration ID
     * @param bool $active New active value
     * @return bool Success status
     */
    public function toggleActive($id, $active) {
        $this->logger->info("Toggling active status for Maksekeskus configuration", [
            'id' => $id,
            'active' => $active ? 'true' : 'false'
        ]);
        
        // If activating this config, deactivate all others first
        if ($active) {
            $this->supabase->request("/rest/v1/maksekeskus_config", 'PATCH', [
                'active' => false
            ], [
                'id' => "neq.{$id}"
            ]);
        }
        
        $result = $this->supabase->update('maksekeskus_config', $id, [
            'active' => $active
        ]);
        
        return $result;
    }
}