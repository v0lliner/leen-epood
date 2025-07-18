/**
 * Unit tests for DataTransformer
 */

import { DataTransformer } from '../data-transformer';
import { Logger } from '../logger';
import { CMSProduct } from '../types';

describe('DataTransformer', () => {
  let transformer: DataTransformer;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('ERROR'); // Suppress logs during tests
    transformer = new DataTransformer(logger);
  });

  describe('transformProduct', () => {
    it('should transform a valid CMS product to Stripe format', () => {
      const cmsProduct: CMSProduct = {
        id: 'cms-123',
        title: 'Test Product',
        description: 'A test product description',
        price: '99.99€',
        category: 'ceramics',
        subcategory: 'vases',
        dimensions: {
          height: 25,
          width: 15,
          depth: 10,
        },
        weight: 1.5,
        available: true,
        image: 'https://example.com/image.jpg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const result = transformer.transformProduct(cmsProduct);

      expect(result.name).toBe('Test Product');
      expect(result.description).toContain('A test product description');
      expect(result.description).toContain('Dimensions: H: 25cm × W: 15cm × D: 10cm');
      expect(result.description).toContain('Weight: 1.5kg');
      expect(result.description).toContain('Category: ceramics / vases');
      expect(result.metadata.cms_id).toBe('cms-123');
      expect(result.metadata.category).toBe('ceramics');
      expect(result.metadata.subcategory).toBe('vases');
      expect(result.images).toEqual(['https://example.com/image.jpg']);
      expect(result.active).toBe(true);
    });

    it('should handle products without optional fields', () => {
      const cmsProduct: CMSProduct = {
        id: 'cms-456',
        title: 'Minimal Product',
        description: '',
        price: '50.00€',
        category: 'clothing',
        available: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = transformer.transformProduct(cmsProduct);

      expect(result.name).toBe('Minimal Product');
      expect(result.metadata.cms_id).toBe('cms-456');
      expect(result.metadata.category).toBe('clothing');
      expect(result.metadata.subcategory).toBeUndefined();
      expect(result.images).toEqual([]);
      expect(result.active).toBe(false);
    });

    it('should truncate long product names', () => {
      const longTitle = 'A'.repeat(300);
      const cmsProduct: CMSProduct = {
        id: 'cms-789',
        title: longTitle,
        description: '',
        price: '25.00€',
        category: 'other',
        available: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = transformer.transformProduct(cmsProduct);

      expect(result.name.length).toBeLessThanOrEqual(250);
      expect(result.name).toEndWith('...');
    });
  });

  describe('transformPrice', () => {
    it('should transform price correctly', () => {
      const cmsProduct: CMSProduct = {
        id: 'cms-123',
        title: 'Test Product',
        description: '',
        price: '99.99€',
        category: 'ceramics',
        available: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = transformer.transformPrice(cmsProduct, 'prod_stripe_123');

      expect(result.product).toBe('prod_stripe_123');
      expect(result.unit_amount).toBe(9999); // 99.99 * 100
      expect(result.currency).toBe('eur');
      expect(result.metadata.cms_id).toBe('cms-123');
      expect(result.metadata.original_price).toBe('99.99€');
      expect(result.active).toBe(true);
    });

    it('should handle different price formats', () => {
      const testCases = [
        { input: '25€', expected: 2500 },
        { input: '25.50€', expected: 2550 },
        { input: '25,50€', expected: 2550 },
        { input: '1000.00', expected: 100000 },
        { input: '0.99', expected: 99 },
      ];

      testCases.forEach(({ input, expected }) => {
        const cmsProduct: CMSProduct = {
          id: 'test',
          title: 'Test',
          description: '',
          price: input,
          category: 'test',
          available: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        const result = transformer.transformPrice(cmsProduct, 'prod_test');
        expect(result.unit_amount).toBe(expected);
      });
    });

    it('should throw error for invalid prices', () => {
      const invalidPrices = ['', '0', 'invalid', '-10', '999999999'];

      invalidPrices.forEach(price => {
        const cmsProduct: CMSProduct = {
          id: 'test',
          title: 'Test',
          description: '',
          price,
          category: 'test',
          available: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        expect(() => {
          transformer.transformPrice(cmsProduct, 'prod_test');
        }).toThrow();
      });
    });
  });

  describe('validateCMSProduct', () => {
    it('should return no errors for valid product', () => {
      const validProduct: CMSProduct = {
        id: 'cms-123',
        title: 'Valid Product',
        description: 'Description',
        price: '99.99€',
        category: 'ceramics',
        available: true,
        image: 'https://example.com/image.jpg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const errors = transformer.validateCMSProduct(validProduct);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid product', () => {
      const invalidProduct: CMSProduct = {
        id: '',
        title: '',
        description: '',
        price: '',
        category: '',
        available: true,
        image: 'invalid-url',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const errors = transformer.validateCMSProduct(invalidProduct);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Product ID is required');
      expect(errors).toContain('Product title is required');
      expect(errors).toContain('Product price is required');
      expect(errors).toContain('Product category is required');
      expect(errors).toContain('Invalid image URL format');
    });
  });
});