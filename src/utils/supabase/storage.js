import { supabase } from './client'
import imageCompression from 'browser-image-compression'

/**
 * File storage utilities for Supabase with automatic image compression
 */
export const storageService = {
  /**
   * Compress image before upload
   * @param {File} file - Original image file
   * @returns {Promise<File>} Compressed image file
   */
  async compressImage(file) {
    try {
      console.log('Original file size:', (file.size / 1024).toFixed(2), 'KB')
      
      const options = {
        maxSizeMB: 0.2, // 200KB max file size
        maxWidthOrHeight: 1920, // Max dimension (only reduce if needed)
        useWebWorker: true,
        fileType: 'image/jpeg', // Convert to JPG
        quality: 0.8, // 80% quality
        preserveExif: false, // Remove EXIF data to save space
        initialQuality: 0.8
      }

      const compressedFile = await imageCompression(file, options)
      
      console.log('Compressed file size:', (compressedFile.size / 1024).toFixed(2), 'KB')
      console.log('Compression ratio:', ((1 - compressedFile.size / file.size) * 100).toFixed(1) + '%')
      
      return compressedFile
    } catch (error) {
      console.warn('Image compression failed, using original file:', error)
      return file // Fallback to original file if compression fails
    }
  },

  /**
   * Upload image to Supabase Storage with automatic compression
   * @param {File} file - Image file to upload
   * @param {string} folder - Folder path (optional)
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async uploadImage(file, folder = '') {
    try {
      // Validate file first
      const validation = this.validateImage(file)
      if (!validation.valid) {
        return { data: null, error: { message: validation.error } }
      }

      // Compress image automatically
      console.log('Compressing image before upload...')
      const compressedFile = await this.compressImage(file)
      
      // Generate unique filename with .jpg extension (since we convert to JPG)
      const originalName = file.name.split('.')[0] // Get name without extension
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${originalName}.jpg`
      const filePath = folder ? `${folder}/${fileName}` : fileName

      console.log('Uploading compressed image to:', filePath)

      // Upload compressed file
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        return { data: null, error }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      console.log('Upload successful:', urlData.publicUrl)

      return { 
        data: {
          path: filePath,
          url: urlData.publicUrl,
          fullPath: data.path
        }, 
        error: null 
      }
    } catch (error) {
      console.error('Upload process failed:', error)
      return { data: null, error: { message: 'Pildi üleslaadimine ebaõnnestus' } }
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
   * Validate image file (before compression)
   * @param {File} file - File to validate
   * @returns {object} Validation result
   */
  validateImage(file) {
    const maxSize = 50 * 1024 * 1024 // 50MB max for original file (will be compressed)
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
        error: 'Originaali faili suurus ei tohi ületada 50MB' 
      }
    }

    return { valid: true, error: null }
  }
}