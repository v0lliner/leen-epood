/**
 * Comprehensive Data Validation System
 * 
 * Validates product data before sending to Stripe and provides detailed error reporting.
 */

import { MIGRATION_CONFIG, ERROR_CODES, SUPPORTED_CURRENCIES } from './config.js';

class DataValidator {
  constructor(logger) {
    this.logger = logger;
    this.validationErrors = [];
    this.validationWarnings = [];
  }

  validateProduct(product) {
    this.validationErrors = [];
    this.validationWarnings = [];
    
    const validatedProduct = {
      id: product.id,
      title: this.validateTitle(product.title),
      description: this.validateDescription(product.description),
      price: this.validatePrice(product.price),
      currency: this.validateCurrency(product.currency || 'eur'),
      category: product.category,
      subcategory: product.subcategory,
      metadata: this.buildMetadata(product)
    };
    
    // Check for critical errors
    if (this.validationErrors.length > 0) {
      const error = new Error(`Product validation failed: ${this.validationErrors.join(', ')}`);
      error.code = ERROR_CODES.INVALID_PRODUCT_DATA;
      error.validationErrors = this.validationErrors;
      error.validationWarnings = this.validationWarnings;
      throw error;
    }
    
    // Log warnings
    if (this.validationWarnings.length > 0) {
      this.logger.warn(`Product validation warnings for ${product.title}`, {
        productId: product.id,
        warnings: this.validationWarnings
      });
    }
    
    return validatedProduct;
  }

  validateTitle(title) {
    if (!title || typeof title !== 'string') {
      this.validationErrors.push('Title is required and must be a string');
      return '';
    }
    
    const trimmedTitle = title.trim();
    
    if (trimmedTitle.length === 0) {
      this.validationErrors.push('Title cannot be empty');
      return '';
    }
    
    if (trimmedTitle.length > MIGRATION_CONFIG.MAX_TITLE_LENGTH) {
      this.validationWarnings.push(`Title truncated from ${trimmedTitle.length} to ${MIGRATION_CONFIG.MAX_TITLE_LENGTH} characters`);
      return trimmedTitle.substring(0, MIGRATION_CONFIG.MAX_TITLE_LENGTH);
    }
    
    // Check for problematic characters
    if (trimmedTitle.includes('\n') || trimmedTitle.includes('\r')) {
      this.validationWarnings.push('Title contains line breaks, they will be replaced with spaces');
      return trimmedTitle.replace(/[\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
    }
    
    return trimmedTitle;
  }

  validateDescription(description) {
    if (!description) {
      return ''; // Description is optional
    }
    
    if (typeof description !== 'string') {
      this.validationWarnings.push('Description must be a string, converting to string');
      description = String(description);
    }
    
    const trimmedDescription = description.trim();
    
    if (trimmedDescription.length > MIGRATION_CONFIG.MAX_DESCRIPTION_LENGTH) {
      this.validationWarnings.push(`Description truncated from ${trimmedDescription.length} to ${MIGRATION_CONFIG.MAX_DESCRIPTION_LENGTH} characters`);
      return trimmedDescription.substring(0, MIGRATION_CONFIG.MAX_DESCRIPTION_LENGTH);
    }
    
    return trimmedDescription;
  }

  validatePrice(priceString) {
    if (!priceString) {
      this.validationErrors.push('Price is required');
      return 0;
    }
    
    // Parse price from various formats
    const priceAmount = this.parsePriceToAmount(priceString);
    
    if (isNaN(priceAmount) || priceAmount <= 0) {
      this.validationErrors.push(`Invalid price: ${priceString}`);
      return 0;
    }
    
    if (priceAmount < MIGRATION_CONFIG.MIN_PRICE_CENTS) {
      this.validationErrors.push(`Price ${priceAmount} cents is below minimum ${MIGRATION_CONFIG.MIN_PRICE_CENTS} cents`);
      return 0;
    }
    
    if (priceAmount > MIGRATION_CONFIG.MAX_PRICE_CENTS) {
      this.validationErrors.push(`Price ${priceAmount} cents exceeds maximum ${MIGRATION_CONFIG.MAX_PRICE_CENTS} cents`);
      return 0;
    }
    
    return priceAmount;
  }

  validateCurrency(currency) {
    if (!currency || typeof currency !== 'string') {
      this.validationWarnings.push('Currency not specified, defaulting to EUR');
      return 'eur';
    }
    
    const normalizedCurrency = currency.toLowerCase().trim();
    
    if (!SUPPORTED_CURRENCIES.includes(normalizedCurrency)) {
      this.validationWarnings.push(`Unsupported currency ${currency}, defaulting to EUR`);
      return 'eur';
    }
    
    return normalizedCurrency;
  }

  buildMetadata(product) {
    const metadata = {};
    
    // Add Supabase ID for tracking
    if (product.id) {
      metadata[MIGRATION_CONFIG.STRIPE_PRODUCT_METADATA_KEYS.SUPABASE_ID] = product.id;
    }
    
    // Add migration timestamp
    metadata[MIGRATION_CONFIG.STRIPE_PRODUCT_METADATA_KEYS.MIGRATION_TIMESTAMP] = new Date().toISOString();
    
    // Add category information
    if (product.category) {
      metadata[MIGRATION_CONFIG.STRIPE_PRODUCT_METADATA_KEYS.ORIGINAL_CATEGORY] = product.category;
    }
    
    if (product.subcategory) {
      metadata[MIGRATION_CONFIG.STRIPE_PRODUCT_METADATA_KEYS.ORIGINAL_SUBCATEGORY] = product.subcategory;
    }
    
    // Validate metadata doesn't exceed Stripe limits
    const metadataString = JSON.stringify(metadata);
    if (metadataString.length > 8000) { // Stripe metadata limit
      this.validationWarnings.push('Metadata too large, some fields may be truncated');
      // Keep only essential metadata
      return {
        [MIGRATION_CONFIG.STRIPE_PRODUCT_METADATA_KEYS.SUPABASE_ID]: product.id,
        [MIGRATION_CONFIG.STRIPE_PRODUCT_METADATA_KEYS.MIGRATION_TIMESTAMP]: new Date().toISOString()
      };
    }
    
    return metadata;
  }

  parsePriceToAmount(priceString) {
    if (typeof priceString === 'number') {
      return Math.round(priceString * 100);
    }
    
    if (!priceString || typeof priceString !== 'string') {
      return 0;
    }
    
    // Remove currency symbols and whitespace
    const cleanPrice = priceString.replace(/[€$£¥₹]/g, '').trim();
    
    // Replace comma with dot for decimal parsing
    const normalizedPrice = cleanPrice.replace(',', '.');
    
    // Parse as float and convert to cents
    const amount = parseFloat(normalizedPrice);
    
    return isNaN(amount) ? 0 : Math.round(amount * 100);
  }

  validateBatch(products) {
    const results = {
      valid: [],
      invalid: [],
      warnings: []
    };
    
    for (const product of products) {
      try {
        const validatedProduct = this.validateProduct(product);
        results.valid.push(validatedProduct);
        
        if (this.validationWarnings.length > 0) {
          results.warnings.push({
            productId: product.id,
            warnings: [...this.validationWarnings]
          });
        }
      } catch (error) {
        results.invalid.push({
          product,
          error: error.message,
          validationErrors: error.validationErrors || [],
          validationWarnings: error.validationWarnings || []
        });
      }
    }
    
    return results;
  }

  // Validate Stripe response data
  validateStripeProduct(stripeProduct) {
    if (!stripeProduct || !stripeProduct.id) {
      throw new Error('Invalid Stripe product response: missing ID');
    }
    
    if (!stripeProduct.name) {
      throw new Error('Invalid Stripe product response: missing name');
    }
    
    return true;
  }

  validateStripePrice(stripePrice) {
    if (!stripePrice || !stripePrice.id) {
      throw new Error('Invalid Stripe price response: missing ID');
    }
    
    if (!stripePrice.product) {
      throw new Error('Invalid Stripe price response: missing product ID');
    }
    
    if (typeof stripePrice.unit_amount !== 'number') {
      throw new Error('Invalid Stripe price response: invalid unit_amount');
    }
    
    return true;
  }
}

export default DataValidator;