/**
 * Debug utilities for troubleshooting image display issues
 */

export const debugImageIssues = {
  /**
   * Test if Supabase connection works
   */
  async testSupabaseConnection() {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/products?select=id,title,image&limit=1`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('✅ Supabase connection test:', { status: response.status, data });
      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase connection failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test if storage bucket is accessible
   */
  async testStorageAccess() {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/bucket/product-images`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        }
      });
      
      const data = await response.json();
      console.log('✅ Storage bucket test:', { status: response.status, data });
      return { success: true, data };
    } catch (error) {
      console.error('❌ Storage bucket access failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test if a specific image URL is accessible
   */
  async testImageUrl(imageUrl) {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      console.log(`✅ Image URL test (${imageUrl}):`, { 
        status: response.status, 
        accessible: response.ok 
      });
      return { success: response.ok, status: response.status };
    } catch (error) {
      console.error(`❌ Image URL test failed (${imageUrl}):`, error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Run comprehensive diagnostics
   */
  async runDiagnostics() {
    console.log('🔍 Starting image display diagnostics...');
    
    const results = {
      supabase: await this.testSupabaseConnection(),
      storage: await this.testStorageAccess(),
      images: []
    };

    // Test a few image URLs if products are available
    if (results.supabase.success && results.supabase.data?.length > 0) {
      for (const product of results.supabase.data.slice(0, 3)) {
        if (product.image) {
          const imageTest = await this.testImageUrl(product.image);
          results.images.push({
            productId: product.id,
            imageUrl: product.image,
            ...imageTest
          });
        }
      }
    }

    // Test CSP issues
    results.csp = this.checkCSP();

    console.log('📊 Diagnostics complete:', results);
    return results;
  },

  /**
   * Check environment variables
   */
  checkEnvironment() {
    const env = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing'
    };
    
    console.log('🔧 Environment check:', env);
    return env;
  },

  /**
   * Check for CSP issues
   */
  checkCSP() {
    // Check if we're in a browser environment
    if (typeof document === 'undefined') return { checked: false };

    // Try to create a test image from Supabase
    const testImg = document.createElement('img');
    testImg.style.display = 'none';
    testImg.src = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/test-image.jpg`;
    
    // Listen for errors
    let hasError = false;
    const errorHandler = () => {
      hasError = true;
      console.error('❌ CSP test image failed to load - likely CSP issue');
    };
    
    testImg.addEventListener('error', errorHandler);
    document.body.appendChild(testImg);
    
    // Clean up
    setTimeout(() => {
      testImg.removeEventListener('error', errorHandler);
      document.body.removeChild(testImg);
    }, 1000);
    
    // Check for CSP meta tag
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    const cspContent = cspMeta ? cspMeta.getAttribute('content') : null;
    
    return {
      checked: true,
      hasCSPMetaTag: !!cspMeta,
      cspContent,
      testImageError: hasError,
      recommendation: hasError ? 'Add Supabase domain to img-src directive in CSP' : 'No CSP issues detected'
    };
  }
};

// Auto-run diagnostics in development
if (import.meta.env.DEV) {
  window.debugImageIssues = debugImageIssues;
  console.log('🛠️ Debug utilities available at window.debugImageIssues');
  console.log('Run window.debugImageIssues.runDiagnostics() to test image loading');
}