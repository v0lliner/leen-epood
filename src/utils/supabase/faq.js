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
   * Get FAQ items organized by pairs (ET/EN together)
   * @returns {Promise<{data: Array, error: object|null}>}
   */
  async getBilingualFAQItems() {
    try {
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      
      if (error) return { data: [], error }
      
      // Group by display_order to create pairs
      const pairs = {}
      data.forEach(item => {
        if (!pairs[item.display_order]) {
          pairs[item.display_order] = { display_order: item.display_order }
        }
        pairs[item.display_order][item.language] = item
      })
      
      // Convert to array and sort by display_order
      const pairsArray = Object.values(pairs).sort((a, b) => a.display_order - b.display_order)
      
      return { data: pairsArray, error: null }
    } catch (error) {
      return { data: [], error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Create or update FAQ item
   * @param {object} faqItem - FAQ item data
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async upsertFAQItem(faqItem) {
    try {
      const { data, error } = await supabase
        .from('faq_items')
        .upsert(faqItem, { 
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
   * Create or update FAQ pair (both languages)
   * @param {object} etData - Estonian FAQ data
   * @param {object} enData - English FAQ data
   * @param {number} displayOrder - Display order
   * @param {string} etId - Existing ET item ID (for updates)
   * @param {string} enId - Existing EN item ID (for updates)
   * @returns {Promise<{error: object|null}>}
   */
  async upsertFAQPair(etData, enData, displayOrder, etId = null, enId = null) {
    try {
      const operations = []
      
      // Handle Estonian item
      if (etData) {
        const etItem = {
          question: etData.question,
          answer: etData.answer,
          language: 'et',
          display_order: displayOrder,
          is_active: true
        }
        
        if (etId) {
          etItem.id = etId
        }
        
        operations.push(
          supabase
            .from('faq_items')
            .upsert(etItem, { onConflict: 'id', ignoreDuplicates: false })
        )
      } else if (etId) {
        // Delete ET item if no data provided but ID exists
        operations.push(
          supabase
            .from('faq_items')
            .delete()
            .eq('id', etId)
        )
      }
      
      // Handle English item
      if (enData) {
        const enItem = {
          question: enData.question,
          answer: enData.answer,
          language: 'en',
          display_order: displayOrder,
          is_active: true
        }
        
        if (enId) {
          enItem.id = enId
        }
        
        operations.push(
          supabase
            .from('faq_items')
            .upsert(enItem, { onConflict: 'id', ignoreDuplicates: false })
        )
      } else if (enId) {
        // Delete EN item if no data provided but ID exists
        operations.push(
          supabase
            .from('faq_items')
            .delete()
            .eq('id', enId)
        )
      }
      
      // Execute all operations
      const results = await Promise.all(operations)
      
      // Check for errors
      for (const result of results) {
        if (result.error) {
          return { error: result.error }
        }
      }
      
      return { error: null }
    } catch (error) {
      return { error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Delete FAQ pair (both languages)
   * @param {string} etId - Estonian item ID
   * @param {string} enId - English item ID
   * @returns {Promise<{error: object|null}>}
   */
  async deleteFAQPair(etId, enId) {
    try {
      const operations = []
      
      if (etId) {
        operations.push(
          supabase
            .from('faq_items')
            .delete()
            .eq('id', etId)
        )
      }
      
      if (enId) {
        operations.push(
          supabase
            .from('faq_items')
            .delete()
            .eq('id', enId)
        )
      }
      
      const results = await Promise.all(operations)
      
      // Check for errors
      for (const result of results) {
        if (result.error) {
          return { error: result.error }
        }
      }
      
      return { error: null }
    } catch (error) {
      return { error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Move FAQ pair up or down
   * @param {number} currentOrder - Current display order
   * @param {string} direction - 'up' or 'down'
   * @returns {Promise<{error: object|null}>}
   */
  async moveFAQPair(currentOrder, direction) {
    try {
      const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1
      
      // Get items to swap
      const { data: currentItems } = await supabase
        .from('faq_items')
        .select('*')
        .eq('display_order', currentOrder)
      
      const { data: targetItems } = await supabase
        .from('faq_items')
        .select('*')
        .eq('display_order', targetOrder)
      
      if (!currentItems?.length || !targetItems?.length) {
        return { error: { message: 'Cannot move item' } }
      }
      
      // Swap display orders
      const operations = []
      
      currentItems.forEach(item => {
        operations.push(
          supabase
            .from('faq_items')
            .update({ display_order: targetOrder })
            .eq('id', item.id)
        )
      })
      
      targetItems.forEach(item => {
        operations.push(
          supabase
            .from('faq_items')
            .update({ display_order: currentOrder })
            .eq('id', item.id)
        )
      })
      
      const results = await Promise.all(operations)
      
      // Check for errors
      for (const result of results) {
        if (result.error) {
          return { error: result.error }
        }
      }
      
      return { error: null }
    } catch (error) {
      return { error: { message: 'Network error occurred' } }
    }
  }
}