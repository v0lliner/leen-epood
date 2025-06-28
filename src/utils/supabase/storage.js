import { supabase } from './client'

/**
 * File storage utilities for Supabase
 */
export const storageService = {
  /**
   * Upload image to Supabase Storage
   * @param {File} file - Image file to upload
   * @param {string} folder - Folder path (optional)
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async uploadImage(file, folder = '') {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = folder ? `${folder}/${fileName}` : fileName

      // Upload file
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) return { data: null, error }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      return { 
        data: {
          path: filePath,
          url: urlData.publicUrl,
          fullPath: data.path
        }, 
        error: null 
      }
    } catch (error) {
      return { data: null, error: { message: 'Upload failed' } }
    }
  },

  /**
   * Delete image from Supabase Storage
   * @param {string} filePath - Path to file in storage
   * @returns {Promise<{error: object|null}>}
   */
  async deleteImage(filePath) {
    try {
      const { error } = await supabase.storage
        .from('product-images')
        .remove([filePath])

      return { error }
    } catch (error) {
      return { error: { message: 'Delete failed' } }
    }
  },

  /**
   * Get public URL for image
   * @param {string} filePath - Path to file in storage
   * @returns {string}
   */
  getImageUrl(filePath) {
    if (!filePath) return ''
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return data.publicUrl
  },

  /**
   * Validate image file
   * @param {File} file - File to validate
   * @returns {object} Validation result
   */
  validateImage(file) {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Lubatud on ainult JPEG, PNG ja WebP failid' 
      }
    }

    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: 'Faili suurus ei tohi ületada 5MB' 
      }
    }

    return { valid: true, error: null }
  }
}