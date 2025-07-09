import { supabase } from './client'

/**
 * Shipping settings management utilities for Supabase
 */
export const shippingSettingsService = {
  /**
   * Get Omniva shipping settings
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async getOmnivaSettings() {
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
   * Update Omniva shipping settings
   * @param {string} id - Settings ID
   * @param {object} updates - Fields to update
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async updateOmnivaSettings(id, updates) {
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
   * Create new Omniva shipping settings
   * @param {object} settings - Settings data
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async createOmnivaSettings(settings) {
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