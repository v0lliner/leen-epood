# CMS to Stripe Migration Setup Guide

## Overview

This guide provides step-by-step instructions for setting up and running the CMS to Stripe migration tool in production environments.

## Prerequisites

### System Requirements
- Node.js 18+ 
- TypeScript 5+
- Minimum 4GB RAM
- 10GB free disk space
- Stable internet connection

### Access Requirements
- Supabase project with service role key
- Stripe account with API access
- Database admin permissions
- Server/container deployment access

## Installation

### 1. Clone and Setup

```bash
# Navigate to migration directory
cd scripts/migration

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Environment Configuration

Edit `.env` file with your specific values:

```bash
# Required: Update these values
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_... # or sk_test_ for testing
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Tune performance settings
MIGRATION_BATCH_SIZE=25
MIGRATION_MAX_CONCURRENCY=3
STRIPE_MAX_RPS=90
```

### 3. Database Preparation

Ensure your products table has the required columns:

```sql
-- Add Stripe integration columns if not present
ALTER TABLE products ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending';
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_sync_status ON products(sync_status);
CREATE INDEX IF NOT EXISTS idx_products_stripe_product_id ON products(stripe_product_id);
```

## Configuration Options

### Migration Strategies

#### Full Migration
```bash
MIGRATION_STRATEGY=full
MIGRATION_SKIP_EXISTING=false
```
Migrates all products, including those already synced.

#### Incremental Migration
```bash
MIGRATION_STRATEGY=incremental
MIGRATION_START_DATE=2024-01-01T00:00:00Z
MIGRATION_END_DATE=2024-12-31T23:59:59Z
MIGRATION_SKIP_EXISTING=true
```
Migrates products within a date range, skipping existing.

#### Selective Migration
```bash
MIGRATION_STRATEGY=selective
MIGRATION_PRODUCT_IDS=prod1,prod2,prod3
```
Migrates only specified product IDs.

### Performance Tuning

#### Development Environment
```bash
MIGRATION_BATCH_SIZE=10
MIGRATION_MAX_CONCURRENCY=5
STRIPE_MAX_RPS=90
```

#### Production Environment
```bash
MIGRATION_BATCH_SIZE=25
MIGRATION_MAX_CONCURRENCY=3
STRIPE_MAX_RPS=80
MIGRATION_LOG_LEVEL=WARN
```

#### High-Volume Environment (10K+ products)
```bash
MIGRATION_BATCH_SIZE=50
MIGRATION_MAX_CONCURRENCY=2
STRIPE_MAX_RPS=70
MIGRATION_CHECKPOINT_INTERVAL=50
```

## Execution

### 1. Validation (Recommended)

Always validate setup before running:

```bash
npm run migrate:validate
```

This checks:
- Environment configuration
- Database connectivity
- Stripe API access
- Required permissions

### 2. Dry Run (Required for Production)

Test the migration without making changes:

```bash
npm run migrate:dry-run
```

Review the logs to ensure expected behavior.

### 3. Production Migration

```bash
# Start migration
npm run migrate

# Or with specific environment
NODE_ENV=production npm run migrate
```

### 4. Resume Interrupted Migration

If migration is interrupted:

```bash
npm run migrate:resume
```

The tool automatically resumes from the last checkpoint.

## Monitoring

### Real-time Progress

The migration provides real-time progress updates:

```
📊 Progress: 45.2% (452/1000) | Success: 448 | Failed: 4 | Rate: 2.3/s | ETA: 2024-01-15T14:30:00Z
```

### Log Files

Logs are written to:
- Console: Real-time progress and errors
- File: `logs/migration-YYYY-MM-DD.log`

### Key Metrics to Monitor

- **Success Rate**: Should be >95%
- **Processing Rate**: 1-5 products/second
- **Memory Usage**: Should remain stable
- **Error Patterns**: Watch for recurring errors

## Error Handling

### Common Issues and Solutions

#### Rate Limit Errors
```
Error: STRIPE_RATE_LIMIT - Stripe rate limit exceeded
```
**Solution**: Reduce `STRIPE_MAX_RPS` value

#### Connection Timeouts
```
Error: SUPABASE_TIMEOUT - Database query timeout
```
**Solution**: Increase `SUPABASE_QUERY_TIMEOUT` or reduce `MIGRATION_BATCH_SIZE`

#### Memory Issues
```
Error: JavaScript heap out of memory
```
**Solution**: Reduce `MIGRATION_BATCH_SIZE` and `MIGRATION_MAX_CONCURRENCY`

#### Validation Errors
```
Error: VALIDATION_ERROR - Product title is required
```
**Solution**: Clean data in CMS before migration

### Circuit Breaker Activation

When services become unreliable:
```
Circuit breaker opened for stripe-create-product
```
The system automatically pauses and retries after recovery time.

## Rollback Procedures

### 1. Stop Migration

```bash
# Send SIGINT (Ctrl+C) for graceful shutdown
# Or SIGTERM for immediate stop
```

### 2. Restore from Backup

```bash
# Backups are stored in backups/ directory
# Restore using your database tools
psql -h your-host -d your-db -f backups/products-backup-TIMESTAMP.sql
```

### 3. Clean Stripe Data (if needed)

```bash
# Use Stripe Dashboard or API to remove created products
# Filter by metadata.cms_id to identify migrated products
```

## Performance Optimization

### Database Optimization

```sql
-- Optimize for migration queries
ANALYZE products;

-- Increase work_mem for large operations
SET work_mem = '256MB';

-- Monitor query performance
EXPLAIN ANALYZE SELECT * FROM products WHERE sync_status IS NULL LIMIT 25;
```

### System Resources

```bash
# Monitor system resources during migration
htop
iostat -x 1
netstat -i
```

### Stripe API Optimization

- Use batch operations where possible
- Implement exponential backoff
- Monitor rate limit headers
- Cache product lookups

## Security Considerations

### API Keys
- Use environment variables only
- Rotate keys after migration
- Limit key permissions to minimum required
- Monitor API key usage

### Data Protection
- Enable backups in production
- Use TLS for all connections
- Audit trail logging
- Secure log file access

### Network Security
- Whitelist IP addresses if possible
- Use VPN for remote access
- Monitor for unusual traffic patterns

## Troubleshooting

### Debug Mode

Enable detailed logging:

```bash
MIGRATION_LOG_LEVEL=DEBUG npm run migrate
```

### Common Log Patterns

#### Successful Processing
```
[2024-01-15T10:30:00Z] INFO | Processing product | Context: {"id":"prod123","title":"Ceramic Vase"}
[2024-01-15T10:30:01Z] INFO | Stripe product created | Context: {"id":"prod_stripe123"}
[2024-01-15T10:30:02Z] INFO | Product migration completed | Context: {"cmsId":"prod123","stripeId":"prod_stripe123"}
```

#### Rate Limiting
```
[2024-01-15T10:30:00Z] DEBUG | Rate limit reached, waiting 100ms
[2024-01-15T10:30:00Z] INFO | Operation succeeded after 1 retries
```

#### Errors
```
[2024-01-15T10:30:00Z] ERROR | Error in stripe-create-product: Invalid request | Context: {"code":"STRIPE_INVALID_REQUEST","severity":"HIGH"}
```

### Performance Issues

#### Slow Processing
1. Check network latency to Stripe/Supabase
2. Reduce batch size
3. Increase retry delays
4. Monitor system resources

#### High Memory Usage
1. Reduce concurrency
2. Implement garbage collection hints
3. Monitor for memory leaks
4. Restart if necessary

#### Database Locks
1. Check for long-running queries
2. Reduce batch size
3. Add query timeouts
4. Monitor connection pool

## Support and Maintenance

### Log Analysis

Use log analysis tools:

```bash
# Count error types
grep "ERROR" logs/migration-*.log | cut -d'|' -f3 | sort | uniq -c

# Monitor progress
tail -f logs/migration-$(date +%Y-%m-%d).log | grep "Progress:"

# Check for patterns
grep "STRIPE_RATE_LIMIT" logs/migration-*.log | wc -l
```

### Health Checks

Regular validation queries:

```sql
-- Check sync status distribution
SELECT sync_status, COUNT(*) FROM products GROUP BY sync_status;

-- Find products with missing Stripe IDs
SELECT id, title FROM products 
WHERE sync_status = 'synced' AND stripe_product_id IS NULL;

-- Check recent sync activity
SELECT DATE(last_synced_at), COUNT(*) FROM products 
WHERE last_synced_at IS NOT NULL 
GROUP BY DATE(last_synced_at) 
ORDER BY DATE(last_synced_at) DESC;
```

### Maintenance Tasks

#### Weekly
- Review error logs
- Check sync status distribution
- Validate random sample of products
- Monitor Stripe usage

#### Monthly
- Archive old logs
- Update API versions
- Review performance metrics
- Test backup restoration

## Contact and Support

For issues not covered in this guide:

1. Check the troubleshooting section
2. Review log files for specific errors
3. Consult Stripe and Supabase documentation
4. Contact your development team

Remember to include relevant log excerpts and configuration details when seeking support.