import { supabase } from './client'

/**
 * Portfolio items management utilities for Supabase
 */
export const portfolioItemService = {
  /**
   * Get all portfolio items
   * @returns {Promise<{data: Array, error: object|null}>}
   */
  async getPortfolioItems() {
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .order('created_at', { ascending: false })
      
      return { data: data || [], error }
    } catch (error) {
      return { data: [], error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Get portfolio item by ID
   * @param {string} id - Portfolio item ID
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async getPortfolioItem(id) {
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('id', id)
        .single()
      
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Create or update portfolio item
   * @param {object} item - Portfolio item data
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async upsertPortfolioItem(item) {
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .upsert(item, { 
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
   * Delete portfolio item
   * @param {string} id - Portfolio item ID
   * @returns {Promise<{error: object|null}>}
   */
  async deletePortfolioItem(id) {
    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', id)
      
      return { error }
    } catch (error) {
      return { error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Get portfolio items by category
   * @param {string} category - Category to filter by
   * @returns {Promise<{data: Array, error: object|null}>}
   */
  async getPortfolioItemsByCategory(category) {
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('category', category)
        .order('year', { ascending: false })
      
      return { data: data || [], error }
    } catch (error) {
      return { data: [], error: { message: 'Network error occurred' } }
    }
  }
}