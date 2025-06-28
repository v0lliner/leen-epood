import { supabase } from './client'

/**
 * Product management utilities for Supabase
 */
export const productService = {
  /**
   * Get all products
   * @returns {Promise<{data: Array, error: object|null}>}
   */
  async getProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      return { data: data || [], error }
    } catch (error) {
      return { data: [], error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Get product by ID
   * @param {string} id - Product ID
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async getProduct(id) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
      
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Create or update product
   * @param {object} product - Product data
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async upsertProduct(product) {
    try {
      const { data, error } = await supabase
        .from('products')
        .upsert(product, { 
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
   * Delete product
   * @param {string} id - Product ID
   * @returns {Promise<{error: object|null}>}
   */
  async deleteProduct(id) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
      
      return { error }
    } catch (error) {
      return { error: { message: 'Network error occurred' } }
    }
  }
}