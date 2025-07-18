#!/usr/bin/env node

/**
 * Connection Test Utility
 * 
 * Tests connections to Supabase and Stripe before running migration.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import MigrationLogger from './logger.js';
import StripeService from './stripe-service.js';
import SupabaseService from './supabase-service.js';
import RateLimiter from './rate-limiter.js';
import RetryHandler from './retry-handler.js';
import DataValidator from './data-validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

async function testConnections() {
  const logger = new MigrationLogger();
  
  try {
    logger.info('🔍 Testing system connections...');
    
    // Initialize services
    const rateLimiter = new RateLimiter(logger);
    const retryHandler = new RetryHandler(logger, rateLimiter);
    const dataValidator = new DataValidator(logger);
    
    const stripeService = new StripeService(logger, retryHandler, dataValidator);
    const supabaseService = new SupabaseService(logger, retryHandler);
    
    // Test Supabase
    logger.info('Testing Supabase connection...');
    const supabaseOk = await supabaseService.testConnection();
    
    if (supabaseOk) {
      logger.success('Supabase connection: OK');
      
      // Get product count
      const productCount = await supabaseService.getProductCount();
      logger.info(`Found ${productCount} products to potentially migrate`);
    } else {
      logger.error('Supabase connection: FAILED');
    }
    
    // Test Stripe
    logger.info('Testing Stripe connection...');
    const stripeOk = await stripeService.testConnection();
    
    if (stripeOk) {
      logger.success('Stripe connection: OK');
      
      // Get account info
      const accountInfo = await stripeService.getAccountInfo();
      if (accountInfo) {
        logger.info('Stripe account info', accountInfo);
      }
    } else {
      logger.error('Stripe connection: FAILED');
    }
    
    // Overall result
    if (supabaseOk && stripeOk) {
      logger.success('✅ All connections successful! Ready to migrate.');
      process.exit(0);
    } else {
      logger.error('❌ Some connections failed. Please check your configuration.');
      process.exit(1);
    }
    
  } catch (error) {
    logger.error('Connection test failed', error);
    process.exit(1);
  }
}

testConnections();