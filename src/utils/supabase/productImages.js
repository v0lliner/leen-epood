import { supabase } from './client'

/**
 * Product images management utilities for Supabase
 */
export const productImageService = {
  /**
   * Get all images for a product
   * @param {string} productId - Product ID
   * @returns {Promise<{data: Array, error: object|null}>}
   */
  async getProductImages(productId) {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true })
      
      return { data: data || [], error }
    } catch (error) {
      return { data: [], error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Add image to product
   * @param {string} productId - Product ID
   * @param {string} imageUrl - Image URL
   * @param {string} imagePath - Storage path
   * @param {boolean} isPrimary - Is this the primary image
   * @param {number} displayOrder - Display order
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async addProductImage(productId, imageUrl, imagePath, isPrimary = false, displayOrder = 0) {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: imageUrl,
          image_path: imagePath,
          is_primary: isPrimary,
          display_order: displayOrder
        })
        .select()
        .single()
      
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Update image
   * @param {string} imageId - Image ID
   * @param {object} updates - Updates to apply
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async updateProductImage(imageId, updates) {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .update(updates)
        .eq('id', imageId)
        .select()
        .single()
      
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Delete image
   * @param {string} imageId - Image ID
   * @returns {Promise<{error: object|null}>}
   */
  async deleteProductImage(imageId) {
    try {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId)
      
      return { error }
    } catch (error) {
      return { error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Set primary image for product
   * @param {string} productId - Product ID
   * @param {string} imageId - Image ID to set as primary
   * @returns {Promise<{error: object|null}>}
   */
  async setPrimaryImage(productId, imageId) {
    try {
      // First, remove primary from all images of this product
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId)

      // Then set the selected image as primary
      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId)
      
      return { error }
    } catch (error) {
      return { error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Reorder images
   * @param {Array} imageOrders - Array of {id, display_order} objects
   * @returns {Promise<{error: object|null}>}
   */
  async reorderImages(imageOrders) {
    try {
      const updates = imageOrders.map(({ id, display_order }) => 
        supabase
          .from('product_images')
          .update({ display_order })
          .eq('id', id)
      )

      await Promise.all(updates)
      return { error: null }
    } catch (error) {
      return { error: { message: 'Network error occurred' } }
    }
  }
}