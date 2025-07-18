# Production-Ready Stripe Migration System

A comprehensive, fault-tolerant migration system for transferring CMS data to Stripe with maximum reliability and error handling.

## 🎯 Overview

This production-ready migration system is designed to handle real-world complexities including:

- **Network failures and API rate limits**
- **Data validation and transformation**
- **Checkpoint/recovery for resumable migrations**
- **Comprehensive error handling and logging**
- **Health monitoring and progress tracking**
- **Rollback capabilities and data verification**

## 🏗️ Architecture

### Core Components

1. **Migration Engine** - Orchestrates the entire process
2. **Rate Limiter** - Manages API rate limits with adaptive throttling
3. **Retry Handler** - Implements exponential backoff for failed operations
4. **Data Validator** - Validates and transforms data before sending to Stripe
5. **Checkpoint Manager** - Provides resumable migrations with state persistence
6. **Stripe Service** - Handles all Stripe API interactions
7. **Supabase Service** - Manages database operations
8. **Logger** - Comprehensive logging with multiple levels and file output

### Migration Flow

```
1. Pre-flight Checks
   ├── Test Supabase connection
   ├── Test Stripe connection
   ├── Validate environment
   └── Get Stripe account info

2. Load Checkpoint (if resuming)
   ├── Load previous state
   └── Resume from last processed product

3. Fetch Products
   ├── Get products from Supabase
   ├── Apply filters (new/failed only)
   └── Create backup

4. Process in Batches
   ├── Validate product data
   ├── Find/create Stripe products
   ├── Find/create Stripe prices
   ├── Update Supabase with Stripe IDs
   └── Save checkpoints periodically

5. Verification & Reporting
   ├── Verify migration results
   ├── Generate comprehensive report
   └── Cleanup checkpoints on success
```

## 🚀 Quick Start

### Prerequisites

1. **Environment Variables** (in `.env` file):
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

2. **Install Dependencies**:
   ```bash
   cd scripts/production-migration
   npm install
   ```

### Basic Usage

```bash
# Test connections first
npm run test-connection

# Preview what would be migrated (safe)
npm run migrate:dry-run

# Run actual migration
npm run migrate

# Force resync all products
npm run migrate:force

# Debug mode with detailed logging
npm run migrate:debug
```

### Advanced Usage

```bash
# Custom batch size for rate limiting
node index.js --batch-size=3

# Skip data validation (faster but riskier)
node index.js --skip-validation

# Don't resume from checkpoint
node index.js --no-checkpoint

# Combine options
node index.js --dry-run --force-resync --log-level=DEBUG
```

## ⚙️ Configuration

### Migration Settings (`config.js`)

```javascript
export const MIGRATION_CONFIG = {
  // Batch Processing
  BATCH_SIZE: 5,                    // Products per batch
  MAX_CONCURRENT_REQUESTS: 3,      // Concurrent API requests
  
  // Rate Limiting
  STRIPE_RATE_LIMIT_PER_SECOND: 25, // Conservative rate limit
  
  // Retry Configuration
  MAX_RETRIES: 5,                   // Max retry attempts
  INITIAL_RETRY_DELAY_MS: 1000,     // Initial retry delay
  RETRY_BACKOFF_MULTIPLIER: 2,      // Exponential backoff
  
  // Timeouts
  SUPABASE_TIMEOUT_MS: 30000,       // 30 second timeout
  STRIPE_TIMEOUT_MS: 30000,         // 30 second timeout
  
  // Data Validation
  MIN_PRICE_CENTS: 50,              // Minimum price (0.50€)
  MAX_PRICE_CENTS: 100000000,       // Maximum price (1M€)
  
  // Recovery & Monitoring
  CHECKPOINT_INTERVAL: 10,          // Save progress every N products
  PROGRESS_REPORT_INTERVAL: 5,      // Report progress every N products
  HEALTH_CHECK_INTERVAL: 50,        // Health check every N operations
};
```

## 🛡️ Error Handling

### Error Categories

1. **Network Errors**
   - Connection timeouts
   - DNS resolution failures
   - SSL/TLS errors

2. **API Errors**
   - Rate limiting (429)
   - Authentication failures (401)
   - Invalid requests (400)
   - Server errors (500)

3. **Data Validation Errors**
   - Missing required fields
   - Invalid price formats
   - Unsupported currencies
   - Data type mismatches

4. **Migration Errors**
   - Duplicate products
   - Partial failures
   - Checkpoint corruption

### Retry Strategies

- **Exponential Backoff**: Delays increase exponentially with each retry
- **Adaptive Rate Limiting**: Automatically reduces rate on consecutive errors
- **Non-Retryable Errors**: Authentication and validation errors are not retried
- **Special Handling**: Rate limit errors use Stripe's suggested retry delay

## 📊 Monitoring & Logging

### Log Levels

- **DEBUG**: Detailed operation logs, API requests/responses
- **INFO**: General progress and status updates
- **WARN**: Non-critical issues and warnings
- **ERROR**: Critical errors and failures

### Log Output

```
[2025-01-18T10:30:45.123Z] [+15.23s] [INFO] Processing batch 3/10 (5 products)
[2025-01-18T10:30:46.456Z] [+16.56s] [SUCCESS] Product migrated: Ceramic Vase
[2025-01-18T10:30:47.789Z] [+17.89s] [WARN] Rate limit reached, waiting 2000ms
[2025-01-18T10:30:50.012Z] [+20.12s] [ERROR] Failed to process product: Invalid price format
```

### Progress Tracking

```
🔄 Progress: [████████████████████     ] 75.0% (150/200) Rate: 2.5/s, ETA: 20s
```

## 🔄 Recovery & Checkpoints

### Automatic Checkpoints

The system automatically saves progress every 10 products (configurable). If the migration is interrupted:

1. **Automatic Resume**: Simply run the script again
2. **State Preservation**: Continues from the last successfully processed product
3. **Error Recovery**: Failed products are marked and can be retried

### Manual Recovery

```bash
# Clear all checkpoints and start fresh
npm run clear-checkpoints

# Resume from specific point (modify checkpoint file)
# Edit logs/migration-checkpoint.json
```

## 🧪 Testing & Validation

### Pre-Migration Testing

```bash
# Test all connections
npm run test-connection

# Dry run to preview changes
npm run migrate:dry-run

# Test with small batch
node index.js --dry-run --batch-size=1
```

### Post-Migration Verification

The system automatically verifies:
- All products have Stripe IDs
- Stripe products exist and are accessible
- Price amounts match original data
- Metadata is correctly set

## 🚨 Troubleshooting

### Common Issues

1. **"Supabase connection failed"**
   ```bash
   # Check environment variables
   echo $VITE_SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   
   # Test connection manually
   npm run test-connection
   ```

2. **"Stripe rate limit exceeded"**
   ```bash
   # Reduce batch size
   node index.js --batch-size=2
   
   # The system will automatically adapt
   ```

3. **"Product validation failed"**
   ```bash
   # Check product data in Supabase
   # Run with debug logging
   node index.js --log-level=DEBUG
   ```

4. **"Migration interrupted"**
   ```bash
   # Simply run again - it will resume
   npm run migrate
   
   # Or start fresh
   npm run clear-checkpoints
   npm run migrate
   ```

### Debug Mode

```bash
# Enable detailed logging
node index.js --log-level=DEBUG

# This will show:
# - API request/response details
# - Rate limiter statistics
# - Retry attempt details
# - Data validation steps
```

### Log Analysis

```bash
# View recent logs
tail -f logs/migration.log

# Search for errors
grep "ERROR" logs/migration.log

# Check specific product
grep "product-id-here" logs/migration.log
```

## 📈 Performance Optimization

### Rate Limiting Strategy

- **Conservative Limits**: Uses 25 req/s (vs Stripe's 100 req/s limit)
- **Adaptive Throttling**: Automatically reduces rate on errors
- **Burst Handling**: Token bucket algorithm allows short bursts
- **Health Monitoring**: Adjusts rate based on error patterns

### Batch Processing

- **Optimal Batch Size**: Default 5 products balances speed vs stability
- **Concurrent Processing**: Limited concurrency prevents overwhelming APIs
- **Memory Management**: Processes in chunks to avoid memory issues

### Network Optimization

- **Connection Reuse**: HTTP keep-alive for better performance
- **Timeout Management**: Appropriate timeouts prevent hanging
- **Retry Logic**: Smart retries reduce unnecessary load

## 🔒 Security Considerations

### API Key Management

- **Environment Variables**: Never hardcode API keys
- **Service Role Key**: Use Supabase service role for server operations
- **Key Rotation**: Support for key rotation without downtime

### Data Protection

- **Backup Creation**: Automatic backup before migration
- **Rollback Capability**: Can reverse changes if needed
- **Audit Trail**: Complete log of all operations

### Access Control

- **Principle of Least Privilege**: Only required permissions
- **Secure Defaults**: Conservative settings by default
- **Error Information**: Sensitive data not logged

## 📋 Migration Checklist

### Pre-Migration

- [ ] Environment variables configured
- [ ] Database backup created
- [ ] Test connections successful
- [ ] Dry run completed successfully
- [ ] Stakeholders notified

### During Migration

- [ ] Monitor progress logs
- [ ] Watch for error patterns
- [ ] Check system resources
- [ ] Verify network stability

### Post-Migration

- [ ] Verify all products migrated
- [ ] Test Stripe integration
- [ ] Update application configuration
- [ ] Archive migration logs
- [ ] Document any issues

## 🆘 Emergency Procedures

### Stop Migration

```bash
# Graceful stop (saves checkpoint)
Ctrl+C

# Force stop (may lose progress)
kill -9 <process-id>
```

### Rollback Changes

```bash
# If rollback is enabled in config
# The system can reverse Stripe changes
# (Implementation depends on requirements)
```

### Data Recovery

```bash
# Restore from backup
# Check logs/migration-backup-*.json

# Reset sync status in Supabase
# UPDATE products SET sync_status = NULL, stripe_product_id = NULL, stripe_price_id = NULL;
```

## 📞 Support

For issues or questions:

1. **Check Logs**: Review `logs/migration.log` for detailed error information
2. **Run Diagnostics**: Use `npm run test-connection` to verify setup
3. **Debug Mode**: Run with `--log-level=DEBUG` for detailed output
4. **Documentation**: Review this guide and inline code comments

## 🔄 Updates & Maintenance

### Regular Maintenance

- Monitor log file sizes
- Archive old migration logs
- Update dependencies regularly
- Review and update rate limits
- Test disaster recovery procedures

### Configuration Updates

- Adjust batch sizes based on performance
- Update rate limits based on API changes
- Modify retry strategies based on error patterns
- Update validation rules for new data types

This production-ready system is designed to handle enterprise-scale migrations with maximum reliability and comprehensive error handling.