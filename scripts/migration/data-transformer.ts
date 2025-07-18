/**
 * Data transformation utilities for CMS to Stripe migration
 */

import { CMSProduct, StripeProductData, StripePriceData } from './types';
import { Logger } from './logger';

export class DataTransformer {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.createChildLogger('transformer');
  }

  public transformProduct(cmsProduct: CMSProduct): StripeProductData {
    this.logger.debug('Transforming CMS product to Stripe format', {
      cmsId: cmsProduct.id,
      title: cmsProduct.title,
    });

    // Clean and validate product name
    const name = this.sanitizeProductName(cmsProduct.title);
    
    // Build description
    const description = this.buildProductDescription(cmsProduct);
    
    // Prepare metadata
    const metadata = this.buildProductMetadata(cmsProduct);
    
    // Process images
    const images = this.processProductImages(cmsProduct);

    const stripeProduct: StripeProductData = {
      name,
      description,
      metadata,
      images,
      active: cmsProduct.available,
    };

    this.logger.debug('Product transformation completed', {
      cmsId: cmsProduct.id,
      stripeName: name,
      metadataKeys: Object.keys(metadata),
    });

    return stripeProduct;
  }

  public transformPrice(cmsProduct: CMSProduct, stripeProductId: string): StripePriceData {
    this.logger.debug('Transforming CMS price to Stripe format', {
      cmsId: cmsProduct.id,
      price: cmsProduct.price,
    });

    const unitAmount = this.parsePrice(cmsProduct.price);
    
    const metadata = {
      cms_id: cmsProduct.id,
      original_price: cmsProduct.price,
    };

    const stripePrice: StripePriceData = {
      product: stripeProductId,
      unit_amount: unitAmount,
      currency: 'eur',
      metadata,
      active: cmsProduct.available,
    };

    this.logger.debug('Price transformation completed', {
      cmsId: cmsProduct.id,
      unitAmount,
      currency: 'eur',
    });

    return stripePrice;
  }

  private sanitizeProductName(title: string): string {
    if (!title || title.trim().length === 0) {
      throw new Error('Product title cannot be empty');
    }

    // Stripe product names have a 5000 character limit
    let sanitized = title.trim();
    
    if (sanitized.length > 250) { // Keep it reasonable
      sanitized = sanitized.substring(0, 247) + '...';
      this.logger.warn('Product name truncated', {
        original: title,
        truncated: sanitized,
      });
    }

    return sanitized;
  }

  private buildProductDescription(cmsProduct: CMSProduct): string {
    const parts: string[] = [];

    if (cmsProduct.description) {
      parts.push(cmsProduct.description);
    }

    // Add dimensions if available
    if (cmsProduct.dimensions) {
      const dimensions = this.formatDimensions(cmsProduct.dimensions);
      if (dimensions) {
        parts.push(`Dimensions: ${dimensions}`);
      }
    }

    // Add weight if available
    if (cmsProduct.weight) {
      parts.push(`Weight: ${cmsProduct.weight}kg`);
    }

    // Add category information
    if (cmsProduct.category) {
      let categoryInfo = `Category: ${cmsProduct.category}`;
      if (cmsProduct.subcategory) {
        categoryInfo += ` / ${cmsProduct.subcategory}`;
      }
      parts.push(categoryInfo);
    }

    const description = parts.join('\n\n');

    // Stripe description limit is 5000 characters
    if (description.length > 4000) {
      const truncated = description.substring(0, 3997) + '...';
      this.logger.warn('Product description truncated', {
        cmsId: cmsProduct.id,
        originalLength: description.length,
        truncatedLength: truncated.length,
      });
      return truncated;
    }

    return description;
  }

  private buildProductMetadata(cmsProduct: CMSProduct): Record<string, string> {
    const metadata: Record<string, string> = {
      cms_id: cmsProduct.id,
      category: cmsProduct.category,
    };

    if (cmsProduct.subcategory) {
      metadata.subcategory = cmsProduct.subcategory;
    }

    if (cmsProduct.dimensions) {
      metadata.dimensions = this.formatDimensions(cmsProduct.dimensions);
    }

    if (cmsProduct.weight) {
      metadata.weight = cmsProduct.weight.toString();
    }

    // Add timestamps
    metadata.created_at = cmsProduct.created_at;
    metadata.updated_at = cmsProduct.updated_at;

    // Stripe metadata values have a 500 character limit per value
    Object.keys(metadata).forEach(key => {
      if (metadata[key] && metadata[key].length > 500) {
        metadata[key] = metadata[key].substring(0, 497) + '...';
        this.logger.warn('Metadata value truncated', {
          cmsId: cmsProduct.id,
          key,
          originalLength: metadata[key].length,
        });
      }
    });

    return metadata;
  }

  private formatDimensions(dimensions: CMSProduct['dimensions']): string {
    if (!dimensions) return '';

    const parts: string[] = [];
    
    if (dimensions.height) parts.push(`H: ${dimensions.height}cm`);
    if (dimensions.width) parts.push(`W: ${dimensions.width}cm`);
    if (dimensions.depth) parts.push(`D: ${dimensions.depth}cm`);

    return parts.join(' × ');
  }

  private processProductImages(cmsProduct: CMSProduct): string[] {
    const images: string[] = [];

    if (cmsProduct.image) {
      // Validate image URL
      if (this.isValidImageUrl(cmsProduct.image)) {
        images.push(cmsProduct.image);
      } else {
        this.logger.warn('Invalid image URL found', {
          cmsId: cmsProduct.id,
          imageUrl: cmsProduct.image,
        });
      }
    }

    // Stripe supports up to 8 images per product
    return images.slice(0, 8);
  }

  private isValidImageUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  private parsePrice(priceString: string): number {
    if (!priceString) {
      throw new Error('Price cannot be empty');
    }

    // Remove currency symbols and whitespace
    const cleanPrice = priceString
      .replace(/[€$£¥₹]/g, '')
      .replace(/\s/g, '')
      .trim();

    // Replace comma with dot for decimal parsing
    const normalizedPrice = cleanPrice.replace(',', '.');

    // Parse as float
    const amount = parseFloat(normalizedPrice);

    if (isNaN(amount) || amount < 0) {
      throw new Error(`Invalid price format: ${priceString}`);
    }

    // Convert to cents (Stripe uses smallest currency unit)
    const cents = Math.round(amount * 100);

    if (cents === 0) {
      throw new Error('Price cannot be zero');
    }

    if (cents > 99999999) { // Stripe limit: $999,999.99
      throw new Error('Price exceeds Stripe maximum limit');
    }

    return cents;
  }

  public validateCMSProduct(product: CMSProduct): string[] {
    const errors: string[] = [];

    if (!product.id) {
      errors.push('Product ID is required');
    }

    if (!product.title || product.title.trim().length === 0) {
      errors.push('Product title is required');
    }

    if (!product.price) {
      errors.push('Product price is required');
    } else {
      try {
        this.parsePrice(product.price);
      } catch (error) {
        errors.push(`Invalid price: ${error.message}`);
      }
    }

    if (!product.category) {
      errors.push('Product category is required');
    }

    if (product.image && !this.isValidImageUrl(product.image)) {
      errors.push('Invalid image URL format');
    }

    return errors;
  }
}