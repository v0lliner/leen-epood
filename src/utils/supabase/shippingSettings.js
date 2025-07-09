import { supabase } from './client'

/**
 * Shipping settings management utilities for Supabase
 */
export const shippingSettingsService = {
  /**
   * Get active Omniva shipping settings
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async getOmnivaShippingSettings() {
    try {
      const { data, error } = await supabase
        .from('omniva_shipping_settings')
        .select('*')
        .eq('active', true)
        .single()
      
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Update Omniva shipping price
   * @param {string} id - Settings ID
   * @param {number} price - New price
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async updateOmnivaShippingPrice(id, price) {
    try {
      const { data, error } = await supabase
        .from('omniva_shipping_settings')
        .update({ price })
        .eq('id', id)
        .select()
        .single()
      
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Get all shipping settings
   * @returns {Promise<{data: Array, error: object|null}>}
   */
  async getAllShippingSettings() {
    try {
      const { data, error } = await supabase
        .from('omniva_shipping_settings')
        .select('*')
        .order('created_at', { ascending: false })
      
      return { data: data || [], error }
    } catch (error) {
      return { data: [], error: { message: 'Network error occurred' } }
    }
  }
}