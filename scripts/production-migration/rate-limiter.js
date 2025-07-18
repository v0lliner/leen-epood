/**
 * Advanced Rate Limiter for Stripe API
 * 
 * Implements token bucket algorithm with burst handling and adaptive rate limiting.
 */

import { MIGRATION_CONFIG } from './config.js';

class RateLimiter {
  constructor(logger) {
    this.logger = logger;
    this.requestsPerSecond = MIGRATION_CONFIG.STRIPE_RATE_LIMIT_PER_SECOND;
    this.windowMs = MIGRATION_CONFIG.RATE_LIMIT_WINDOW_MS;
    
    // Token bucket implementation
    this.tokens = this.requestsPerSecond;
    this.maxTokens = this.requestsPerSecond;
    this.lastRefill = Date.now();
    
    // Adaptive rate limiting
    this.consecutiveErrors = 0;
    this.adaptiveMultiplier = 1.0;
    
    // Request tracking
    this.requestCount = 0;
    this.totalWaitTime = 0;
    
    this.logger.debug('Rate limiter initialized', {
      requestsPerSecond: this.requestsPerSecond,
      windowMs: this.windowMs
    });
  }

  async waitForToken() {
    const now = Date.now();
    const timeSinceLastRefill = now - this.lastRefill;
    
    // Refill tokens based on time elapsed
    if (timeSinceLastRefill >= this.windowMs) {
      const tokensToAdd = Math.floor(timeSinceLastRefill / this.windowMs) * this.requestsPerSecond;
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
    
    // Apply adaptive rate limiting if we've had recent errors
    const effectiveTokens = this.tokens * this.adaptiveMultiplier;
    
    if (effectiveTokens >= 1) {
      this.tokens -= (1 / this.adaptiveMultiplier);
      this.requestCount++;
      return;
    }
    
    // Calculate wait time
    const waitTime = this.windowMs - timeSinceLastRefill;
    this.totalWaitTime += waitTime;
    
    this.logger.debug(`Rate limit reached, waiting ${waitTime}ms`, {
      tokens: this.tokens,
      adaptiveMultiplier: this.adaptiveMultiplier,
      consecutiveErrors: this.consecutiveErrors
    });
    
    await this.sleep(waitTime);
    return this.waitForToken(); // Recursive call after waiting
  }

  onSuccess() {
    // Reset adaptive rate limiting on success
    if (this.consecutiveErrors > 0) {
      this.consecutiveErrors = 0;
      this.adaptiveMultiplier = Math.min(1.0, this.adaptiveMultiplier * 1.1);
      
      this.logger.debug('Rate limiter: Success recorded, adaptive multiplier increased', {
        adaptiveMultiplier: this.adaptiveMultiplier
      });
    }
  }

  onError(error) {
    this.consecutiveErrors++;
    
    // Reduce rate on consecutive errors
    if (this.consecutiveErrors >= 3) {
      this.adaptiveMultiplier = Math.max(0.1, this.adaptiveMultiplier * 0.8);
      
      this.logger.warn('Rate limiter: Multiple errors detected, reducing rate', {
        consecutiveErrors: this.consecutiveErrors,
        adaptiveMultiplier: this.adaptiveMultiplier,
        error: error.message
      });
    }
    
    // Special handling for rate limit errors
    if (error.code === 'rate_limit') {
      this.adaptiveMultiplier = Math.max(0.1, this.adaptiveMultiplier * 0.5);
      this.logger.warn('Rate limiter: Stripe rate limit hit, significantly reducing rate', {
        adaptiveMultiplier: this.adaptiveMultiplier
      });
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    return {
      requestCount: this.requestCount,
      totalWaitTime: this.totalWaitTime,
      averageWaitTime: this.requestCount > 0 ? this.totalWaitTime / this.requestCount : 0,
      adaptiveMultiplier: this.adaptiveMultiplier,
      consecutiveErrors: this.consecutiveErrors,
      currentTokens: this.tokens
    };
  }

  reset() {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
    this.consecutiveErrors = 0;
    this.adaptiveMultiplier = 1.0;
    this.requestCount = 0;
    this.totalWaitTime = 0;
    
    this.logger.info('Rate limiter reset');
  }
}

export default RateLimiter;