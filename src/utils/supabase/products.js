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
   * Generate a unique slug for a product
   * @param {string} baseSlug - Base slug to make unique
   * @param {string} excludeId - Product ID to exclude from uniqueness check (for updates)
   * @returns {Promise<{data: string|null, error: object|null}>}
   */
  async generateUniqueSlug(baseSlug, excludeId = null) {
    try {
      let uniqueSlug = baseSlug
      let counter = 1
      
      while (true) {
        // Check if slug exists
        let query = supabase
          .from('products')
          .select('id')
          .eq('slug', uniqueSlug)
        
        // Exclude current product if updating
        if (excludeId) {
          query = query.neq('id', excludeId)
        }
        
        const { data, error } = await query
        
        if (error) {
          return { data: null, error }
        }
        
        // If no products found with this slug, it's unique
        if (!data || data.length === 0) {
          return { data: uniqueSlug, error: null }
        }
        
        // Generate next variation
        uniqueSlug = `${baseSlug}-${counter}`
        counter++
        
        // Prevent infinite loop
        if (counter > 100) {
          return { 
            data: null, 
            error: { message: 'Unable to generate unique slug after 100 attempts' } 
          }
        }
      }
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