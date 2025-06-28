import { supabase } from './client'

/**
 * Category management utilities for Supabase
 */
export const categoryService = {
  /**
   * Get all categories with hierarchical structure
   * @returns {Promise<{data: Array, error: object|null}>}
   */
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      
      if (error) return { data: [], error }
      
      // Organize into hierarchical structure
      const categories = data || []
      const parentCategories = categories.filter(cat => !cat.parent_id)
      const childCategories = categories.filter(cat => cat.parent_id)
      
      const hierarchical = parentCategories.map(parent => ({
        ...parent,
        children: childCategories
          .filter(child => child.parent_id === parent.id)
          .sort((a, b) => a.display_order - b.display_order)
      }))
      
      return { data: hierarchical, error: null }
    } catch (error) {
      return { data: [], error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Get category by ID
   * @param {string} id - Category ID
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async getCategory(id) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single()
      
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Create or update category
   * @param {object} category - Category data
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async upsertCategory(category) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .upsert(category, { 
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
   * Delete category
   * @param {string} id - Category ID
   * @returns {Promise<{error: object|null}>}
   */
  async deleteCategory(id) {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
      
      return { error }
    } catch (error) {
      return { error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Generate unique slug from name
   * @param {string} name - Category name
   * @param {string} excludeId - ID to exclude from uniqueness check
   * @returns {Promise<string>}
   */
  async generateSlug(name, excludeId = null) {
    const baseSlug = name
      .toLowerCase()
      .replace(/[äöüõ]/g, (match) => {
        const map = { 'ä': 'a', 'ö': 'o', 'ü': 'u', 'õ': 'o' }
        return map[match] || match
      })
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')

    let slug = baseSlug
    let counter = 1

    while (true) {
      let query = supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)

      // Only add the neq filter if excludeId is provided and not null/undefined
      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data } = await query.single()

      if (!data) break
      
      slug = `${baseSlug}-${counter}`
      counter++
    }

    return slug
  }
}