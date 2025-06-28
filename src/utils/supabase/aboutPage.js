import { supabase } from './client'

/**
 * About page content management utilities for Supabase
 */
export const aboutPageService = {
  /**
   * Get all about page content sections for a specific language
   * @param {string} language - Language code (et, en)
   * @returns {Promise<{data: Array, error: object|null}>}
   */
  async getAboutContent(language = 'et') {
    try {
      const { data, error } = await supabase
        .from('about_page_content')
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
   * Get about content section by section identifier and language
   * @param {string} section - Section identifier
   * @param {string} language - Language code (et, en)
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async getAboutSection(section, language = 'et') {
    try {
      const { data, error } = await supabase
        .from('about_page_content')
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
   * Update about content section for specific language
   * @param {string} section - Section identifier
   * @param {string} language - Language code
   * @param {object} updates - Updates to apply
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async updateAboutSection(section, language, updates) {
    try {
      const { data, error } = await supabase
        .from('about_page_content')
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
   * Create or update about content section for specific language
   * @param {object} sectionData - Section data including language
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async upsertAboutSection(sectionData) {
    try {
      const { data, error } = await supabase
        .from('about_page_content')
        .upsert(sectionData, { 
          onConflict: 'section,language',
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
   * @param {string} language - Language code (et, en)
   * @returns {Promise<{data: object, error: object|null}>}
   */
  async getOrganizedContent(language = 'et') {
    try {
      const { data, error } = await this.getAboutContent(language)
      
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
      
      if (etResult.error && enResult.error) {
        return { data: {}, error: etResult.error }
      }
      
      return { 
        data: {
          et: etResult.data || {},
          en: enResult.data || {}
        }, 
        error: null 
      }
    } catch (error) {
      return { data: {}, error: { message: 'Network error occurred' } }
    }
  }
}