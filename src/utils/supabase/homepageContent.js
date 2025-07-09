import { supabase } from './client'

/**
 * Homepage content management utilities for Supabase
 */
export const homepageContentService = {
  /**
   * Get all homepage content sections for a specific language
   * @param {string} language - Language code (et, en)
   * @returns {Promise<{data: Array, error: object|null}>}
   */
  async getHomepageContent(language = 'et') {
    try {
      const { data, error } = await supabase
        .from('homepage_content')
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
   * Get homepage content section by section identifier and language
   * @param {string} section - Section identifier
   * @param {string} language - Language code (et, en)
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async getHomepageSection(section, language = 'et') {
    try {
      const { data, error } = await supabase
        .from('homepage_content')
        .select('*')
        .eq('section', section)
        .eq('language', language)
        .single()
      
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Update homepage content section for specific language
   * @param {string} section - Section identifier
   * @param {string} language - Language code
   * @param {object} updates - Updates to apply
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async updateHomepageSection(section, language, updates) {
    try {
      const { data, error } = await supabase
        .from('homepage_content')
        .update(updates)
        .eq('section', section)
        .eq('language', language)
        .select()
        .single()
      
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Get content organized by sections for easy use
   * @param {string} language - Language code (et, en)
   * @returns {Promise<{data: object, error: object|null}>}
   */
  async getOrganizedContent(language = 'et') {
    try {
      const { data, error } = await this.getHomepageContent(language)
      
      if (error) return { data: {}, error }
      
      const organized = {}
      data.forEach(section => {
        organized[section.section] = section
      })
      
      return { data: organized, error: null }
    } catch (error) {
      return { data: {}, error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Get content for both languages organized by sections
   * @returns {Promise<{data: object, error: object|null}>}
   */
  async getBilingualContent() {
    try {
      const [etResult, enResult] = await Promise.all([
        this.getOrganizedContent('et'),
        this.getOrganizedContent('en')
      ])
    console.log('🏠 Fetching homepage content for language:', language)
      
      if (etResult.error && enResult.error) {
        return { data: {}, error: etResult.error }
      }
      
      return { 
        data: {
          et: etResult.data || {},
      console.error('❌ Homepage content database error:', error)
          en: enResult.data || {}
        }, 
        error: null 
    console.log('✅ Homepage content fetched successfully:', data?.length, 'items')
      }
    } catch (error) {
    console.error('❌ Error fetching homepage content:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    })
    }
  }
}