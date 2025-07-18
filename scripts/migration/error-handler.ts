/**
 * Comprehensive error handling system for migration operations
 */

import { MigrationError } from './types';
import { Logger } from './logger';

export class ErrorHandler {
  private logger: Logger;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public handleError(error: any, context: string): MigrationError {
    const migrationError = this.classifyError(error, context);
    
    this.logger.error(
      `Error in ${context}: ${migrationError.message}`,
      { 
        code: migrationError.code,
        severity: migrationError.severity,
        retryable: migrationError.retryable 
      },
      error
    );

    // Update circuit breaker
    const circuitBreaker = this.getCircuitBreaker(context);
    if (migrationError.retryable) {
      circuitBreaker.recordFailure();
    } else {
      circuitBreaker.recordSuccess(); // Don't penalize for non-retryable errors
    }

    return migrationError;
  }

  private classifyError(error: any, context: string): MigrationError {
    // Stripe API errors
    if (error.type === 'StripeError') {
      return this.handleStripeError(error);
    }

    // Supabase errors
    if (error.code && typeof error.code === 'string') {
      return this.handleSupabaseError(error);
    }

    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return {
        code: 'NETWORK_ERROR',
        message: `Network error: ${error.message}`,
        details: error,
        retryable: true,
        severity: 'MEDIUM',
      };
    }

    // Rate limit errors
    if (error.message?.includes('rate limit') || error.status === 429) {
      return {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded',
        details: error,
        retryable: true,
        severity: 'LOW',
      };
    }

    // Validation errors
    if (error.message?.includes('validation') || error.status === 400) {
      return {
        code: 'VALIDATION_ERROR',
        message: `Validation error: ${error.message}`,
        details: error,
        retryable: false,
        severity: 'HIGH',
      };
    }

    // Generic error
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      details: error,
      retryable: true,
      severity: 'MEDIUM',
    };
  }

  private handleStripeError(error: any): MigrationError {
    switch (error.type) {
      case 'StripeCardError':
        return {
          code: 'STRIPE_CARD_ERROR',
          message: `Card error: ${error.message}`,
          details: error,
          retryable: false,
          severity: 'LOW',
        };

      case 'StripeRateLimitError':
        return {
          code: 'STRIPE_RATE_LIMIT',
          message: 'Stripe rate limit exceeded',
          details: error,
          retryable: true,
          severity: 'LOW',
        };

      case 'StripeInvalidRequestError':
        return {
          code: 'STRIPE_INVALID_REQUEST',
          message: `Invalid request: ${error.message}`,
          details: error,
          retryable: false,
          severity: 'HIGH',
        };

      case 'StripeAPIError':
        return {
          code: 'STRIPE_API_ERROR',
          message: `Stripe API error: ${error.message}`,
          details: error,
          retryable: true,
          severity: 'MEDIUM',
        };

      case 'StripeConnectionError':
        return {
          code: 'STRIPE_CONNECTION_ERROR',
          message: 'Connection to Stripe failed',
          details: error,
          retryable: true,
          severity: 'MEDIUM',
        };

      case 'StripeAuthenticationError':
        return {
          code: 'STRIPE_AUTH_ERROR',
          message: 'Stripe authentication failed',
          details: error,
          retryable: false,
          severity: 'CRITICAL',
        };

      default:
        return {
          code: 'STRIPE_UNKNOWN_ERROR',
          message: `Unknown Stripe error: ${error.message}`,
          details: error,
          retryable: true,
          severity: 'MEDIUM',
        };
    }
  }

  private handleSupabaseError(error: any): MigrationError {
    switch (error.code) {
      case 'PGRST116': // No rows returned
        return {
          code: 'SUPABASE_NO_ROWS',
          message: 'No data found',
          details: error,
          retryable: false,
          severity: 'LOW',
        };

      case 'PGRST301': // Timeout
        return {
          code: 'SUPABASE_TIMEOUT',
          message: 'Database query timeout',
          details: error,
          retryable: true,
          severity: 'MEDIUM',
        };

      case '23505': // Unique violation
        return {
          code: 'SUPABASE_DUPLICATE',
          message: 'Duplicate record',
          details: error,
          retryable: false,
          severity: 'LOW',
        };

      case '23503': // Foreign key violation
        return {
          code: 'SUPABASE_FK_VIOLATION',
          message: 'Foreign key constraint violation',
          details: error,
          retryable: false,
          severity: 'HIGH',
        };

      case '42P01': // Table doesn't exist
        return {
          code: 'SUPABASE_TABLE_NOT_FOUND',
          message: 'Database table not found',
          details: error,
          retryable: false,
          severity: 'CRITICAL',
        };

      default:
        return {
          code: 'SUPABASE_ERROR',
          message: `Database error: ${error.message}`,
          details: error,
          retryable: true,
          severity: 'MEDIUM',
        };
    }
  }

  public isRetryable(error: MigrationError): boolean {
    return error.retryable;
  }

  public shouldCircuitBreak(context: string): boolean {
    const circuitBreaker = this.getCircuitBreaker(context);
    return circuitBreaker.isOpen();
  }

  private getCircuitBreaker(context: string): CircuitBreaker {
    if (!this.circuitBreakers.has(context)) {
      this.circuitBreakers.set(context, new CircuitBreaker(context, this.logger));
    }
    return this.circuitBreakers.get(context)!;
  }

  public recordSuccess(context: string): void {
    const circuitBreaker = this.getCircuitBreaker(context);
    circuitBreaker.recordSuccess();
  }
}

class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  private readonly failureThreshold = 5;
  private readonly recoveryTimeMs = 60000; // 1 minute
  private readonly context: string;
  private readonly logger: Logger;

  constructor(context: string, logger: Logger) {
    this.context = context;
    this.logger = logger;
  }

  public recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.logger.warn(`Circuit breaker opened for ${this.context}`, {
        failureCount: this.failureCount,
        threshold: this.failureThreshold,
      });
    }
  }

  public recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  public isOpen(): boolean {
    if (this.state === 'CLOSED') {
      return false;
    }

    if (this.state === 'OPEN') {
      if (this.lastFailureTime && 
          Date.now() - this.lastFailureTime.getTime() > this.recoveryTimeMs) {
        this.state = 'HALF_OPEN';
        this.logger.info(`Circuit breaker half-open for ${this.context}`);
        return false;
      }
      return true;
    }

    // HALF_OPEN state
    return false;
  }
}

export class RetryManager {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 0) {
          this.logger.info(`Operation succeeded after ${attempt} retries`, { context });
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          this.logger.error(`Operation failed after ${maxRetries} retries`, { context }, error);
          break;
        }

        const delay = this.calculateDelay(attempt, baseDelayMs);
        this.logger.warn(`Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`, 
          { context }, error);
        
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  private calculateDelay(attempt: number, baseDelayMs: number): number {
    // Exponential backoff with jitter
    const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}