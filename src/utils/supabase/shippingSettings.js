import { supabase } from './client'

/**
 * Shipping settings management utilities for Supabase
 */
export const shippingSettingsService = {
  /**
   * Get Omniva shipping settings (alias for backward compatibility)
   * @returns {Promise<{data: object|null, error: object|null}>} 
   */
  async getOmnivaSettings() {
    return this.getOmnivaShippingSettings()
  },

  /**
   * Get Omniva shipping settings
   * @returns {Promise<{data: object|null, error: object|null}>} 
   */
  async getOmnivaShippingSettings() {
    try {
      const { data, error } = await supabase
        .from('omniva_shipping_settings')
        .select('*')
        .eq('active', true)
        .maybeSingle()
      
      return { data, error }
    } catch (error) {
      console.error('Error fetching Omniva settings:', error)
      return { data: null, error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Update Omniva shipping settings (alias for backward compatibility)
   * @param {string} id - Settings ID
   * @param {object} updates - Fields to update (price, currency, active)
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async updateOmnivaSettings(id, updates) {
    return this.updateOmnivaShippingSettings(id, updates)
  },

  /**
   * Update Omniva shipping settings
   * @param {string} id - Settings ID
   * @param {object} updates - Fields to update (price, currency, active)
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async updateOmnivaShippingSettings(id, updates) {
    try {
      const { data, error } = await supabase
        .from('omniva_shipping_settings')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      return { data, error }
    } catch (error) {
      console.error('Error updating Omniva settings:', error)
      return { data: null, error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Create new Omniva shipping settings (alias for backward compatibility)
   * @param {object} settings - Settings data (price, currency, active)
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async createOmnivaSettings(settings) {
    return this.createOmnivaShippingSettings(settings)
  },

  /**
   * Create new Omniva shipping settings
   * @param {object} settings - Settings data (price, currency, active)
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async createOmnivaShippingSettings(settings) {
    try {
      // First, deactivate all existing settings
      await supabase
        .from('omniva_shipping_settings')
        .update({ active: false })
        .eq('active', true)
      
      // Then create new settings
      const { data, error } = await supabase
        .from('omniva_shipping_settings')
        .insert(settings)
        .select()
        .single()
      
      return { data, error }
    } catch (error) {
      console.error('Error creating Omniva settings:', error)
      return { data: null, error: { message: 'Network error occurred' } }
    }
  }
}