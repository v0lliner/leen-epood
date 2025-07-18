/**
 * Advanced Retry Handler with Exponential Backoff
 * 
 * Implements sophisticated retry logic with different strategies for different error types.
 */

import { MIGRATION_CONFIG, ERROR_CODES } from './config.js';

class RetryHandler {
  constructor(logger, rateLimiter) {
    this.logger = logger;
    this.rateLimiter = rateLimiter;
    this.maxRetries = MIGRATION_CONFIG.MAX_RETRIES;
    this.initialDelay = MIGRATION_CONFIG.INITIAL_RETRY_DELAY_MS;
    this.maxDelay = MIGRATION_CONFIG.MAX_RETRY_DELAY_MS;
    this.backoffMultiplier = MIGRATION_CONFIG.RETRY_BACKOFF_MULTIPLIER;
  }

  async executeWithRetry(operation, context = {}) {
    let lastError;
    let attempt = 0;
    
    while (attempt <= this.maxRetries) {
      try {
        // Wait for rate limiter before each attempt
        await this.rateLimiter.waitForToken();
        
        const result = await operation();
        
        // Success - notify rate limiter and return result
        this.rateLimiter.onSuccess();
        
        if (attempt > 0) {
          this.logger.success(`Operation succeeded after ${attempt} retries`, context);
        }
        
        return { success: true, data: result, attempts: attempt + 1 };
        
      } catch (error) {
        lastError = error;
        attempt++;
        
        // Notify rate limiter of error
        this.rateLimiter.onError(error);
        
        this.logger.warn(`Attempt ${attempt}/${this.maxRetries + 1} failed`, {
          error: error.message,
          code: error.code,
          context
        });
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          this.logger.error('Non-retryable error encountered, aborting retries', error, context);
          break;
        }
        
        // Don't wait after the last attempt
        if (attempt <= this.maxRetries) {
          const delay = this.calculateDelay(attempt, error);
          this.logger.debug(`Waiting ${delay}ms before retry ${attempt + 1}`, { delay, error: error.message });
          await this.sleep(delay);
        }
      }
    }
    
    // All retries exhausted
    this.logger.error(`Operation failed after ${attempt} attempts`, lastError, context);
    return { success: false, error: lastError, attempts: attempt };
  }

  isNonRetryableError(error) {
    // Stripe-specific non-retryable errors
    if (error.type === 'StripeInvalidRequestError') {
      // Don't retry on invalid data
      if (error.code === 'parameter_invalid_string_empty' ||
          error.code === 'parameter_invalid_integer' ||
          error.code === 'parameter_missing') {
        return true;
      }
    }
    
    // Supabase-specific non-retryable errors
    if (error.code === 'PGRST116') { // RLS policy violation
      return true;
    }
    
    // Authentication errors
    if (error.code === 'invalid_api_key' || 
        error.code === 'authentication_required' ||
        error.status === 401) {
      return true;
    }
    
    // Data validation errors
    if (error.code === ERROR_CODES.INVALID_PRODUCT_DATA ||
        error.code === ERROR_CODES.MISSING_REQUIRED_FIELD) {
      return true;
    }
    
    return false;
  }

  calculateDelay(attempt, error) {
    let baseDelay = this.initialDelay * Math.pow(this.backoffMultiplier, attempt - 1);
    
    // Special handling for rate limit errors
    if (error.code === 'rate_limit') {
      // Use Stripe's suggested retry delay if available
      const retryAfter = error.headers?.['retry-after'];
      if (retryAfter) {
        baseDelay = parseInt(retryAfter) * 1000; // Convert to milliseconds
      } else {
        baseDelay = Math.max(baseDelay, 5000); // Minimum 5 seconds for rate limits
      }
    }
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * baseDelay; // Up to 30% jitter
    const finalDelay = Math.min(baseDelay + jitter, this.maxDelay);
    
    return Math.round(finalDelay);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Specialized retry methods for different operations
  async retrySupabaseOperation(operation, context = {}) {
    return this.executeWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), MIGRATION_CONFIG.SUPABASE_TIMEOUT_MS);
      
      try {
        const result = await operation(controller.signal);
        clearTimeout(timeoutId);
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error(`Supabase operation timed out after ${MIGRATION_CONFIG.SUPABASE_TIMEOUT_MS}ms`);
        }
        throw error;
      }
    }, { ...context, operation: 'supabase' });
  }

  async retryStripeOperation(operation, context = {}) {
    return this.executeWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), MIGRATION_CONFIG.STRIPE_TIMEOUT_MS);
      
      try {
        const result = await operation();
        clearTimeout(timeoutId);
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error(`Stripe operation timed out after ${MIGRATION_CONFIG.STRIPE_TIMEOUT_MS}ms`);
        }
        throw error;
      }
    }, { ...context, operation: 'stripe' });
  }
}

export default RetryHandler;