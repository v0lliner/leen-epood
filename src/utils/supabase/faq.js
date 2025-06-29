import { supabase } from './client'

/**
 * FAQ management utilities for Supabase
 */
export const faqService = {
  /**
   * Get all FAQ items for a specific language
   * @param {string} language - Language code (et, en)
   * @returns {Promise<{data: Array, error: object|null}>}
   */
  async getFAQItems(language = 'et') {
    try {
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .eq('is_active', true)
        .eq('language', language)
        .order('display_order', { ascending: true })
      
      return { data: data || [], error }
    } catch (error) {
      return { data: [], error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Get FAQ item by ID
   * @param {string} id - FAQ item ID
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async getFAQItem(id) {
    try {
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .eq('id', id)
        .single()
      
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Create or update FAQ item
   * @param {object} item - FAQ item data
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async upsertFAQItem(item) {
    try {
      // If creating new item and no display_order specified, set it to the end
      if (!item.id && !item.display_order) {
        const { data: maxOrderData } = await supabase
          .from('faq_items')
          .select('display_order')
          .eq('language', item.language)
          .order('display_order', { ascending: false })
          .limit(1)
        
        const maxOrder = maxOrderData?.[0]?.display_order || 0
        item.display_order = maxOrder + 1
      }

      const { data, error } = await supabase
        .from('faq_items')
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
   * Delete FAQ item
   * @param {string} id - FAQ item ID
   * @returns {Promise<{error: object|null}>}
   */
  async deleteFAQItem(id) {
    try {
      const { error } = await supabase
        .from('faq_items')
        .delete()
        .eq('id', id)
      
      return { error }
    } catch (error) {
      return { error: { message: 'Network error occurred' } }
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
          .from('faq_items')
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
   * @param {string} id - FAQ item ID
   * @returns {Promise<{error: object|null}>}
   */
  async moveItemUp(id) {
    try {
      // Get current item
      const { data: currentItem, error: currentError } = await this.getFAQItem(id)
      if (currentError || !currentItem) return { error: currentError }

      // Get item above (lower display_order) in same language
      const { data: aboveItems, error: aboveError } = await supabase
        .from('faq_items')
        .select('*')
        .eq('language', currentItem.language)
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
   * @param {string} id - FAQ item ID
   * @returns {Promise<{error: object|null}>}
   */
  async moveItemDown(id) {
    try {
      // Get current item
      const { data: currentItem, error: currentError } = await this.getFAQItem(id)
      if (currentError || !currentItem) return { error: currentError }

      // Get item below (higher display_order) in same language
      const { data: belowItems, error: belowError } = await supabase
        .from('faq_items')
        .select('*')
        .eq('language', currentItem.language)
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
  },

  /**
   * Get bilingual FAQ items organized by language
   * @returns {Promise<{data: object, error: object|null}>}
   */
  async getBilingualFAQItems() {
    try {
      const [etResult, enResult] = await Promise.all([
        this.getFAQItems('et'),
        this.getFAQItems('en')
      ])
      
      if (etResult.error && enResult.error) {
        return { data: {}, error: etResult.error }
      }
      
      return { 
        data: {
          et: etResult.data || [],
          en: enResult.data || []
        }, 
        error: null 
      }
    } catch (error) {
      return { data: {}, error: { message: 'Network error occurred' } }
    }
  }
}