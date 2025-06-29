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
      console.log('Getting product images for product ID:', productId)
      
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true })
      
      console.log('Product images query result:', { data, error })
      
      return { data: data || [], error }
    } catch (error) {
      console.error('Error in getProductImages:', error)
      return { data: [], error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Add image to product with proper error handling and validation
   * @param {string} productId - Product ID
   * @param {string} imageUrl - Image URL
   * @param {string} imagePath - Storage path
   * @param {boolean} isPrimary - Is this the primary image
   * @param {number} displayOrder - Display order
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async addProductImage(productId, imageUrl, imagePath, isPrimary = false, displayOrder = 0) {
    try {
      console.log('Adding product image:', {
        productId,
        imageUrl,
        imagePath,
        isPrimary,
        displayOrder
      })

      // Validate inputs
      if (!productId || !imageUrl) {
        return { data: null, error: { message: 'Product ID and image URL are required' } }
      }

      // If this is set as primary, first remove primary from all other images
      if (isPrimary) {
        console.log('Removing primary status from other images...')
        const { error: updateError } = await supabase
          .from('product_images')
          .update({ is_primary: false })
          .eq('product_id', productId)
        
        if (updateError) {
          console.error('Error updating existing primary images:', updateError)
        }
      }

      const imageData = {
        product_id: productId,
        image_url: imageUrl,
        image_path: imagePath,
        is_primary: isPrimary,
        display_order: displayOrder
      }

      console.log('Inserting image data:', imageData)

      const { data, error } = await supabase
        .from('product_images')
        .insert(imageData)
        .select()
        .single()
      
      console.log('Add product image result:', { data, error })
      
      if (error) {
        console.error('Database insert error:', error)
        return { data: null, error }
      }

      // Verify the image was actually inserted
      if (data) {
        console.log('Successfully inserted image with ID:', data.id)
        
        // Double-check by fetching the image
        const { data: verifyData, error: verifyError } = await supabase
          .from('product_images')
          .select('*')
          .eq('id', data.id)
          .single()
        
        if (verifyError) {
          console.error('Error verifying inserted image:', verifyError)
        } else {
          console.log('Verified inserted image:', verifyData)
        }
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('Error in addProductImage:', error)
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
      console.log('Deleting product image:', imageId)
      
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId)
      
      console.log('Delete product image result:', { error })
      
      return { error }
    } catch (error) {
      console.error('Error in deleteProductImage:', error)
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
      console.log('Setting primary image:', { productId, imageId })
      
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
      
      console.log('Set primary image result:', { error })
      
      return { error }
    } catch (error) {
      console.error('Error in setPrimaryImage:', error)
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
      console.log('Reordering images:', imageOrders)
      
      const updates = imageOrders.map(({ id, display_order }) => 
        supabase
          .from('product_images')
          .update({ display_order })
          .eq('id', id)
      )

      await Promise.all(updates)
      return { error: null }
    } catch (error) {
      console.error('Error in reorderImages:', error)
      return { error: { message: 'Network error occurred' } }
    }
  },

  /**
   * Get product images count for debugging
   * @param {string} productId - Product ID
   * @returns {Promise<{count: number, error: object|null}>}
   */
  async getProductImagesCount(productId) {
    try {
      const { count, error } = await supabase
        .from('product_images')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId)
      
      console.log(`Product ${productId} has ${count} images`)
      return { count: count || 0, error }
    } catch (error) {
      console.error('Error getting product images count:', error)
      return { count: 0, error: { message: 'Network error occurred' } }
    }
  }
}