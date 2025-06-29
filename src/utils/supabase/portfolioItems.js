import { supabase } from './client'

/**
 * Portfolio items management utilities for Supabase
 */
export const portfolioItemService = {
  /**
   * Get all portfolio items ordered by display_order
   * @returns {Promise<{data: Array, error: object|null}>}
   */
  async getPortfolioItems() {
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false }) // Secondary sort for items with same display_order
      
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
      // If creating new item and no display_order specified, set it to the end
      if (!item.id && !item.display_order) {
        const { data: maxOrderData } = await supabase
          .from('portfolio_items')
          .select('display_order')
          .order('display_order', { ascending: false })
          .limit(1)
        
        const maxOrder = maxOrderData?.[0]?.display_order || 0
        item.display_order = maxOrder + 1
      }

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
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
      
      return { data: data || [], error }
    } catch (error) {
      return { data: [], error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Update display order for multiple items
   * @param {Array} orderUpdates - Array of {id, display_order} objects
   * @returns {Promise<{error: object|null}>}
   */
  async updateDisplayOrder(orderUpdates) {
    try {
      const updates = orderUpdates.map(({ id, display_order }) => 
        supabase
          .from('portfolio_items')
          .update({ display_order })
          .eq('id', id)
      )

      await Promise.all(updates)
      return { error: null }
    } catch (error) {
      return { error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Move item up in order
   * @param {string} id - Portfolio item ID
   * @returns {Promise<{error: object|null}>}
   */
  async moveItemUp(id) {
    try {
      // Get current item
      const { data: currentItem, error: currentError } = await this.getPortfolioItem(id)
      if (currentError || !currentItem) return { error: currentError }

      // Get item above (lower display_order)
      const { data: aboveItems, error: aboveError } = await supabase
        .from('portfolio_items')
        .select('*')
        .lt('display_order', currentItem.display_order)
        .order('display_order', { ascending: false })
        .limit(1)

      if (aboveError) return { error: aboveError }
      if (!aboveItems || aboveItems.length === 0) return { error: null } // Already at top

      const aboveItem = aboveItems[0]

      // Swap display orders
      await this.updateDisplayOrder([
        { id: currentItem.id, display_order: aboveItem.display_order },
        { id: aboveItem.id, display_order: currentItem.display_order }
      ])

      return { error: null }
    } catch (error) {
      return { error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Move item down in order
   * @param {string} id - Portfolio item ID
   * @returns {Promise<{error: object|null}>}
   */
  async moveItemDown(id) {
    try {
      // Get current item
      const { data: currentItem, error: currentError } = await this.getPortfolioItem(id)
      if (currentError || !currentItem) return { error: currentError }

      // Get item below (higher display_order)
      const { data: belowItems, error: belowError } = await supabase
        .from('portfolio_items')
        .select('*')
        .gt('display_order', currentItem.display_order)
        .order('display_order', { ascending: true })
        .limit(1)

      if (belowError) return { error: belowError }
      if (!belowItems || belowItems.length === 0) return { error: null } // Already at bottom

      const belowItem = belowItems[0]

      // Swap display orders
      await this.updateDisplayOrder([
        { id: currentItem.id, display_order: belowItem.display_order },
        { id: belowItem.id, display_order: currentItem.display_order }
      ])

      return { error: null }
    } catch (error) {
      return { error: { message: 'Network error occurred' } }
    }
  }
}