/**
 * Utility for transforming Supabase Storage images
 * 
 * This utility helps optimize image loading by using Supabase Storage's
 * transformation capabilities to resize and optimize images on-the-fly.
 */

/**
 * Transform a Supabase Storage image URL to apply width, height, and quality transformations
 * 
 * @param {string} imageUrl - Original Supabase Storage image URL
 * @param {object} options - Transformation options
 * @param {number} [options.width] - Desired width in pixels
 * @param {number} [options.height] - Desired height in pixels
 * @param {number} [options.quality=80] - Image quality (1-100)
 * @param {string} [options.format='webp'] - Output format (webp, jpeg, png)
 * @returns {string} Transformed image URL
 */
export const transformImage = (imageUrl, options = {}) => {
  // Return original URL if it's not a Supabase Storage URL
  if (!imageUrl || !imageUrl.includes('supabase.co/storage/v1/object/public')) {
    return imageUrl;
  }

  try {
    // Create a URL object to work with the URL parts
    const url = new URL(imageUrl);
    
    // Default options
    const defaults = {
      width: null,
      height: null,
      quality: 80,
      format: 'webp'
    };
    
    // Merge defaults with provided options
    const settings = { ...defaults, ...options };
    
    // Build the transformation query parameters
    const params = new URLSearchParams(url.search);
    
    if (settings.width) {
      params.set('width', settings.width.toString());
    }
    
    if (settings.height) {
      params.set('height', settings.height.toString());
    }
    
    params.set('quality', settings.quality.toString());
    params.set('format', settings.format);
    
    // Apply the transformation parameters to the URL
    url.search = params.toString();
    
    return url.toString();
  } catch (error) {
    console.error('Error transforming image URL:', error);
    return imageUrl; // Return original URL if transformation fails
  }
};

/**
 * Get appropriate image size based on device type and display context
 * 
 * @param {string} context - Display context (card, gallery, thumbnail, etc.)
 * @param {boolean} isMobile - Whether the current device is mobile
 * @returns {object} Width, height, and quality settings
 */
export const getImageSizeForContext = (context, isMobile = false) => {
  switch (context) {
    case 'hero':
      return isMobile 
        ? { width: 800, quality: 85 } 
        : { width: 1200, quality: 85 };
    
    case 'card':
      return isMobile
        ? { width: 320, quality: 75 } // Reduced size for mobile
        : { width: 400, quality: 75 };
    
    case 'gallery-main':
      return isMobile 
        ? { width: 480, quality: 80 } // Reduced size for mobile
        : { width: 800, quality: 80 };
    
    case 'gallery-thumbnail':
      return { width: 200, quality: 75 };
    
    case 'portfolio':
      return isMobile 
        ? { width: 480, quality: 80 } // Reduced size for mobile
        : { width: 500, quality: 80 };
    
    case 'lightbox':
      return isMobile
        ? { width: 800, quality: 85 } // Reduced size for mobile
        : { width: 1200, quality: 85 };
    
    default:
      return { width: 800, quality: 80 };
  }
};