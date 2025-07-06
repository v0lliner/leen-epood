import { supabase } from './client'

/**
 * Maksekeskus configuration management utilities for Supabase
 */
export const maksekeskusConfigService = {
  /**
   * Get the current Maksekeskus configuration
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async getMaksekeskusConfig() {
    try {
      // Get the active configuration
      const { data, error } = await supabase
        .from('maksekeskus_config')
        .select('*')
        .eq('active', true)
        .single()
      
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Get the masked configuration for display in admin UI
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async getMaskedConfig() {
    try {
      // Get the masked view of the configuration
      const { data, error } = await supabase
        .from('admin_payment_config_view')
        .select('*')
        .single()
      
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Create or update Maksekeskus configuration
   * @param {object} configData - Configuration data
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async upsertMaksekeskusConfig(configData) {
    try {
      // First, deactivate all existing configurations
      if (configData.active) {
        await supabase
          .from('maksekeskus_config')
          .update({ active: false })
          .eq('active', true)
      }
      
      // Then insert or update the new configuration
      const { data, error } = await supabase
        .from('maksekeskus_config')
        .upsert(configData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single()
      
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Update specific fields of the configuration
   * @param {string} id - Configuration ID
   * @param {object} updates - Fields to update
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async updateConfigFields(id, updates) {
    try {
      const { data, error } = await supabase
        .from('maksekeskus_config')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Toggle test mode for a configuration
   * @param {string} id - Configuration ID
   * @param {boolean} testMode - New test mode value
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async toggleTestMode(id, testMode) {
    return this.updateConfigFields(id, { test_mode: testMode })
  },

  /**
   * Toggle active status for a configuration
   * @param {string} id - Configuration ID
   * @param {boolean} active - New active value
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async toggleActive(id, active) {
    // If activating this config, deactivate all others first
    if (active) {
      await supabase
        .from('maksekeskus_config')
        .update({ active: false })
        .neq('id', id)
    }
    
    return this.updateConfigFields(id, { active })
  }
}