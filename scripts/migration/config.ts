/**
 * Configuration management for the migration system
 */

import { MigrationConfig } from './types';
import * as crypto from 'crypto';

export class ConfigManager {
  private config: MigrationConfig;

  constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  private loadConfiguration(): MigrationConfig {
    const env = process.env.NODE_ENV || 'development';
    
    return {
      environment: env as 'development' | 'staging' | 'production',
      dryRun: process.env.MIGRATION_DRY_RUN === 'true',
      batchSize: parseInt(process.env.MIGRATION_BATCH_SIZE || '10'),
      maxRetries: parseInt(process.env.MIGRATION_MAX_RETRIES || '3'),
      retryDelayMs: parseInt(process.env.MIGRATION_RETRY_DELAY || '1000'),
      maxConcurrency: parseInt(process.env.MIGRATION_MAX_CONCURRENCY || '5'),
      checkpointInterval: parseInt(process.env.MIGRATION_CHECKPOINT_INTERVAL || '100'),
      backupEnabled: process.env.MIGRATION_BACKUP_ENABLED !== 'false',
      logLevel: (process.env.MIGRATION_LOG_LEVEL || 'INFO') as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
      
      stripe: {
        apiKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
        apiVersion: process.env.STRIPE_API_VERSION || '2023-10-16',
        maxRequestsPerSecond: parseInt(process.env.STRIPE_MAX_RPS || '90'), // Conservative limit
      },
      
      supabase: {
        url: process.env.SUPABASE_URL || '',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        connectionPoolSize: parseInt(process.env.SUPABASE_POOL_SIZE || '10'),
        queryTimeout: parseInt(process.env.SUPABASE_QUERY_TIMEOUT || '30000'),
      },
      
      migration: {
        strategy: (process.env.MIGRATION_STRATEGY || 'incremental') as 'full' | 'incremental' | 'selective',
        startDate: process.env.MIGRATION_START_DATE,
        endDate: process.env.MIGRATION_END_DATE,
        productIds: process.env.MIGRATION_PRODUCT_IDS?.split(','),
        skipExisting: process.env.MIGRATION_SKIP_EXISTING !== 'false',
      },
    };
  }

  private validateConfiguration(): void {
    const errors: string[] = [];

    // Required environment variables
    if (!this.config.stripe.apiKey) {
      errors.push('STRIPE_SECRET_KEY is required');
    }
    
    if (!this.config.supabase.url) {
      errors.push('SUPABASE_URL is required');
    }
    
    if (!this.config.supabase.serviceKey) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY is required');
    }

    // Validate ranges
    if (this.config.batchSize < 1 || this.config.batchSize > 100) {
      errors.push('Batch size must be between 1 and 100');
    }
    
    if (this.config.maxConcurrency < 1 || this.config.maxConcurrency > 20) {
      errors.push('Max concurrency must be between 1 and 20');
    }
    
    if (this.config.stripe.maxRequestsPerSecond > 100) {
      errors.push('Stripe rate limit cannot exceed 100 requests per second');
    }

    // Production safety checks
    if (this.config.environment === 'production') {
      if (this.config.batchSize > 50) {
        errors.push('Production batch size should not exceed 50 for safety');
      }
      
      if (!this.config.backupEnabled) {
        errors.push('Backup must be enabled in production');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  public getConfig(): MigrationConfig {
    return { ...this.config };
  }

  public getConfigHash(): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(this.config))
      .digest('hex')
      .substring(0, 16);
  }

  public isDryRun(): boolean {
    return this.config.dryRun;
  }

  public isProduction(): boolean {
    return this.config.environment === 'production';
  }
}

// Default configuration template
export const DEFAULT_CONFIG_TEMPLATE = `
# Migration Configuration
NODE_ENV=development
MIGRATION_DRY_RUN=true
MIGRATION_BATCH_SIZE=10
MIGRATION_MAX_RETRIES=3
MIGRATION_RETRY_DELAY=1000
MIGRATION_MAX_CONCURRENCY=5
MIGRATION_CHECKPOINT_INTERVAL=100
MIGRATION_BACKUP_ENABLED=true
MIGRATION_LOG_LEVEL=INFO

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_API_VERSION=2023-10-16
STRIPE_MAX_RPS=90

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_POOL_SIZE=10
SUPABASE_QUERY_TIMEOUT=30000

# Migration Strategy
MIGRATION_STRATEGY=incremental
MIGRATION_START_DATE=2024-01-01
MIGRATION_END_DATE=2024-12-31
MIGRATION_PRODUCT_IDS=
MIGRATION_SKIP_EXISTING=true
`;