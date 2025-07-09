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
   * Update Omniva shipping price
   * @param {number} price - New shipping price
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async updateOmnivaShippingPrice(price) {
    try {
      // First get the active settings
      const { data: existingSettings, error: fetchError } = await this.getOmnivaSettings()
      
      if (fetchError) {
        return { data: null, error: fetchError }
      }
      
      if (existingSettings) {
        // Update existing settings
        const { data, error } = await supabase
          .from('omniva_shipping_settings')
          .update({ price })
          .eq('id', existingSettings.id)
          .select()
          .single()
        
        return { data, error }
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('omniva_shipping_settings')
          .insert({
            price,
            currency: 'EUR',
            active: true
          })
          .select()
          .single()
        
        return { data, error }
      }
    } catch (error) {
      console.error('Error updating Omniva shipping price:', error)
      return { data: null, error: { message: 'Network error occurred' } }
    }
  }
}