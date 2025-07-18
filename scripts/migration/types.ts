/**
 * Type definitions for the CMS to Stripe migration system
 */

export interface MigrationConfig {
  environment: 'development' | 'staging' | 'production';
  dryRun: boolean;
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;
  maxConcurrency: number;
  checkpointInterval: number;
  backupEnabled: boolean;
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  stripe: {
    apiKey: string;
    webhookSecret: string;
    apiVersion: string;
    maxRequestsPerSecond: number;
  };
  supabase: {
    url: string;
    serviceKey: string;
    connectionPoolSize: number;
    queryTimeout: number;
  };
  migration: {
    strategy: 'full' | 'incremental' | 'selective';
    startDate?: string;
    endDate?: string;
    productIds?: string[];
    skipExisting: boolean;
  };
}

export interface CMSProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  subcategory?: string;
  dimensions?: {
    height?: number;
    width?: number;
    depth?: number;
  };
  weight?: number;
  available: boolean;
  image?: string;
  created_at: string;
  updated_at: string;
}

export interface StripeProductData {
  name: string;
  description?: string;
  metadata: {
    cms_id: string;
    category: string;
    subcategory?: string;
    dimensions?: string;
    weight?: string;
  };
  images?: string[];
  active: boolean;
}

export interface StripePriceData {
  product: string;
  unit_amount: number;
  currency: string;
  metadata: {
    cms_id: string;
    original_price: string;
  };
  active: boolean;
}

export interface MigrationResult {
  success: boolean;
  cmsId: string;
  stripeProductId?: string;
  stripePriceId?: string;
  error?: string;
  retryCount: number;
  processingTime: number;
}

export interface MigrationProgress {
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  skippedRecords: number;
  currentBatch: number;
  totalBatches: number;
  startTime: Date;
  estimatedCompletion?: Date;
  averageProcessingTime: number;
}

export interface CheckpointData {
  lastProcessedId: string;
  progress: MigrationProgress;
  timestamp: Date;
  configHash: string;
}

export interface MigrationError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface BackupData {
  timestamp: Date;
  products: CMSProduct[];
  checksum: string;
  version: string;
}