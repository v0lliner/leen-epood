import { supabase } from './client'

/**
 * About page content management utilities for Supabase
 */
export const aboutPageService = {
  /**
   * Get all about page content sections
   * @returns {Promise<{data: Array, error: object|null}>}
   */
  async getAboutContent() {
    try {
      const { data, error } = await supabase
        .from('about_page_content')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      
      return { data: data || [], error }
    } catch (error) {
      return { data: [], error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Get about content section by section identifier
   * @param {string} section - Section identifier
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async getAboutSection(section) {
    try {
      const { data, error } = await supabase
        .from('about_page_content')
        .select('*')
        .eq('section', section)
        .single()
      
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Update about content section
   * @param {string} section - Section identifier
   * @param {object} updates - Updates to apply
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async updateAboutSection(section, updates) {
    try {
      const { data, error } = await supabase
        .from('about_page_content')
        .update(updates)
        .eq('section', section)
        .select()
        .single()
      
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Create or update about content section
   * @param {object} sectionData - Section data
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async upsertAboutSection(sectionData) {
    try {
      const { data, error } = await supabase
        .from('about_page_content')
        .upsert(sectionData, { 
          onConflict: 'section',
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
   * Get content organized by sections for easy use
   * @returns {Promise<{data: object, error: object|null}>}
   */
  async getOrganizedContent() {
    try {
      const { data, error } = await this.getAboutContent()
      
      if (error) return { data: {}, error }
      
      const organized = {}
      data.forEach(section => {
        organized[section.section] = section
      })
      
      return { data: organized, error: null }
    } catch (error) {
      return { data: {}, error: { message: 'Network error occurred' } }
    }
  }
}