# CMS to Stripe Migration Tool

A production-ready, fault-tolerant migration system for transferring product data from your CMS to Stripe with comprehensive error handling, monitoring, and recovery capabilities.

## 🚀 Features

- **Fault-Tolerant Architecture**: Exponential backoff, circuit breakers, and automatic retry mechanisms
- **Flexible Migration Strategies**: Full, incremental, and selective migration options
- **Real-time Monitoring**: Progress tracking, ETA calculations, and comprehensive logging
- **Resume Capability**: Checkpoint system allows resuming interrupted migrations
- **Data Integrity**: Automatic backups, validation, and integrity checks
- **Production Ready**: Rate limiting, connection pooling, and resource management
- **Comprehensive Error Handling**: Detailed error classification and recovery strategies

## 📋 Quick Start

### 1. Installation

```bash
cd scripts/migration
npm install
cp .env.example .env
```

### 2. Configuration

Edit `.env` with your credentials:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_test_...
MIGRATION_DRY_RUN=true
```

### 3. Validation

```bash
npm run migrate:validate
```

### 4. Test Run

```bash
npm run migrate:dry-run
```

### 5. Production Migration

```bash
NODE_ENV=production npm run migrate
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SUPABASE_URL` | Supabase project URL | - | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | - | ✅ |
| `STRIPE_SECRET_KEY` | Stripe API key | - | ✅ |
| `MIGRATION_STRATEGY` | Migration strategy | `incremental` | ❌ |
| `MIGRATION_BATCH_SIZE` | Products per batch | `10` | ❌ |
| `MIGRATION_MAX_CONCURRENCY` | Parallel operations | `5` | ❌ |
| `STRIPE_MAX_RPS` | Rate limit | `90` | ❌ |

### Migration Strategies

#### Full Migration
Migrates all products, including previously synced ones.
```bash
MIGRATION_STRATEGY=full
MIGRATION_SKIP_EXISTING=false
```

#### Incremental Migration
Migrates products within a date range, skipping existing.
```bash
MIGRATION_STRATEGY=incremental
MIGRATION_START_DATE=2024-01-01T00:00:00Z
MIGRATION_END_DATE=2024-12-31T23:59:59Z
```

#### Selective Migration
Migrates only specified product IDs.
```bash
MIGRATION_STRATEGY=selective
MIGRATION_PRODUCT_IDS=prod1,prod2,prod3
```

## 📊 Monitoring

### Real-time Progress

```
📊 Progress: 45.2% (452/1000) | Success: 448 | Failed: 4 | Rate: 2.3/s | ETA: 2024-01-15T14:30:00Z
```

### Log Files

- **Console**: Real-time progress and critical errors
- **File**: `logs/migration-YYYY-MM-DD.log` - Detailed operation logs
- **Reports**: `reports/migration-report-TIMESTAMP.json` - Final summary

### Key Metrics

- **Success Rate**: Target >95%
- **Processing Rate**: 1-5 products/second
- **Error Distribution**: Monitor for patterns
- **Resource Usage**: Memory, CPU, network

## 🛠 Error Handling

### Error Classification

| Severity | Description | Action |
|----------|-------------|--------|
| `LOW` | Minor issues, migration continues | Log and continue |
| `MEDIUM` | Retryable errors | Retry with backoff |
| `HIGH` | Data issues requiring attention | Skip and report |
| `CRITICAL` | System failures | Stop migration |

### Common Issues

#### Rate Limiting
```
Error: STRIPE_RATE_LIMIT - Stripe rate limit exceeded
```
**Solution**: Reduce `STRIPE_MAX_RPS` value

#### Database Timeouts
```
Error: SUPABASE_TIMEOUT - Database query timeout
```
**Solution**: Reduce `MIGRATION_BATCH_SIZE` or increase timeout

#### Validation Errors
```
Error: VALIDATION_ERROR - Product title is required
```
**Solution**: Clean data in CMS before migration

## 🔄 Recovery

### Resume Interrupted Migration

```bash
npm run migrate:resume
```

The system automatically resumes from the last checkpoint.

### Manual Recovery

1. **Check Logs**: Review error patterns in log files
2. **Fix Data**: Clean problematic records in CMS
3. **Reset if Needed**: Clear checkpoints for fresh start
4. **Restore Backup**: Use automatic backups if corruption occurs

### Rollback Procedures

```sql
-- Reset migration status
UPDATE products 
SET stripe_product_id = NULL, 
    stripe_price_id = NULL, 
    sync_status = 'pending' 
WHERE sync_status = 'failed';
```

## 🧪 Testing

### Unit Tests

```bash
npm test
npm run test:watch
```

### Integration Testing

```bash
# Test with small dataset
MIGRATION_BATCH_SIZE=5 npm run migrate:dry-run

# Test specific products
MIGRATION_STRATEGY=selective MIGRATION_PRODUCT_IDS=test1,test2 npm run migrate:dry-run
```

### Load Testing

```bash
# Simulate high-volume migration
MIGRATION_BATCH_SIZE=50 MIGRATION_MAX_CONCURRENCY=10 npm run migrate:dry-run
```

## 📈 Performance Tuning

### Development Environment
```bash
MIGRATION_BATCH_SIZE=10
MIGRATION_MAX_CONCURRENCY=5
STRIPE_MAX_RPS=90
```

### Production Environment
```bash
MIGRATION_BATCH_SIZE=25
MIGRATION_MAX_CONCURRENCY=3
STRIPE_MAX_RPS=80
```

### High-Volume Environment (10K+ products)
```bash
MIGRATION_BATCH_SIZE=50
MIGRATION_MAX_CONCURRENCY=2
STRIPE_MAX_RPS=70
MIGRATION_CHECKPOINT_INTERVAL=50
```

## 🔒 Security

### Best Practices

- Store API keys in environment variables only
- Use service role keys with minimal permissions
- Enable audit logging
- Rotate keys after migration
- Monitor for unusual API usage

### Data Protection

- Automatic backups before migration
- Encrypted connections (TLS)
- Audit trail logging
- Secure log file storage

## 📚 Documentation

- [Setup Guide](docs/setup-guide.md) - Detailed installation and configuration
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions
- [API Reference](docs/api-reference.md) - Technical implementation details

## 🤝 Support

### Self-Service

1. Check [troubleshooting guide](docs/troubleshooting.md)
2. Review log files for specific errors
3. Validate configuration with `npm run migrate:validate`
4. Test with dry-run mode

### Escalation

For critical issues:

1. Gather relevant logs and configuration
2. Document steps to reproduce
3. Include system environment details
4. Contact development team with context

## 📝 License

MIT License - see LICENSE file for details.

## 🔄 Version History

- **v1.0.0**: Initial production release
  - Full migration capabilities
  - Comprehensive error handling
  - Resume functionality
  - Production monitoring

---

**⚠️ Important**: Always run in dry-run mode first and validate results before production migration.