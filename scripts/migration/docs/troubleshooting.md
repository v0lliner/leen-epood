# Migration Troubleshooting Guide

## Quick Diagnosis

### 1. Check System Status

```bash
# Verify services are accessible
npm run migrate:validate

# Check recent logs
tail -100 logs/migration-$(date +%Y-%m-%d).log

# Monitor system resources
top -p $(pgrep -f "migration")
```

### 2. Common Error Patterns

| Error Code | Severity | Typical Cause | Solution |
|------------|----------|---------------|----------|
| `STRIPE_RATE_LIMIT` | LOW | Too many requests | Reduce `STRIPE_MAX_RPS` |
| `SUPABASE_TIMEOUT` | MEDIUM | Database overload | Reduce `MIGRATION_BATCH_SIZE` |
| `VALIDATION_ERROR` | HIGH | Bad data | Clean CMS data |
| `STRIPE_AUTH_ERROR` | CRITICAL | Invalid API key | Check credentials |
| `NETWORK_ERROR` | MEDIUM | Connection issues | Check network/firewall |

## Detailed Error Solutions

### Stripe API Errors

#### Rate Limiting (STRIPE_RATE_LIMIT)
```
Error: STRIPE_RATE_LIMIT - Stripe rate limit exceeded
```

**Immediate Actions:**
1. Reduce rate limit: `STRIPE_MAX_RPS=50`
2. Increase retry delay: `MIGRATION_RETRY_DELAY=2000`
3. Resume migration: `npm run migrate:resume`

**Long-term Solutions:**
- Monitor Stripe dashboard for usage patterns
- Implement adaptive rate limiting
- Consider upgrading Stripe plan

#### Authentication Errors (STRIPE_AUTH_ERROR)
```
Error: STRIPE_AUTH_ERROR - Stripe authentication failed
```

**Diagnosis:**
```bash
# Test API key manually
curl -u sk_test_...: https://api.stripe.com/v1/products?limit=1
```

**Solutions:**
1. Verify API key format and permissions
2. Check if key is for correct environment (test/live)
3. Regenerate key if compromised
4. Ensure key has required permissions

#### Invalid Request Errors (STRIPE_INVALID_REQUEST)
```
Error: STRIPE_INVALID_REQUEST - Invalid request: Name is required
```

**Common Causes:**
- Empty or invalid product names
- Malformed metadata
- Invalid price values
- Missing required fields

**Solutions:**
1. Enable data validation: `MIGRATION_LOG_LEVEL=DEBUG`
2. Review failing products in logs
3. Clean data in CMS before retry
4. Add custom validation rules

### Supabase Database Errors

#### Connection Timeouts (SUPABASE_TIMEOUT)
```
Error: SUPABASE_TIMEOUT - Database query timeout
```

**Immediate Actions:**
1. Reduce batch size: `MIGRATION_BATCH_SIZE=5`
2. Increase timeout: `SUPABASE_QUERY_TIMEOUT=60000`
3. Reduce concurrency: `MIGRATION_MAX_CONCURRENCY=1`

**Diagnosis:**
```sql
-- Check for blocking queries
SELECT pid, state, query_start, query 
FROM pg_stat_activity 
WHERE state != 'idle' 
ORDER BY query_start;

-- Check table locks
SELECT * FROM pg_locks WHERE relation::regclass::text = 'products';
```

#### Connection Pool Exhaustion
```
Error: remaining connection slots are reserved
```

**Solutions:**
1. Reduce pool size: `SUPABASE_POOL_SIZE=5`
2. Implement connection retry logic
3. Monitor connection usage
4. Consider database scaling

#### Data Integrity Issues (SUPABASE_FK_VIOLATION)
```
Error: SUPABASE_FK_VIOLATION - Foreign key constraint violation
```

**Diagnosis:**
```sql
-- Check referential integrity
SELECT p.id, p.title 
FROM products p 
LEFT JOIN categories c ON p.category_id = c.id 
WHERE c.id IS NULL;
```

**Solutions:**
1. Fix data relationships in CMS
2. Add missing reference records
3. Update migration logic to handle orphaned records

### Network and Infrastructure Issues

#### Connection Resets (NETWORK_ERROR)
```
Error: NETWORK_ERROR - Connection reset by peer
```

**Diagnosis:**
```bash
# Test connectivity
ping api.stripe.com
nslookup your-project.supabase.co
curl -I https://api.stripe.com/v1/products

# Check firewall rules
iptables -L
netstat -tulpn | grep :443
```

**Solutions:**
1. Implement exponential backoff
2. Add connection pooling
3. Check firewall/proxy settings
4. Consider using different network

#### DNS Resolution Issues
```
Error: ENOTFOUND - getaddrinfo ENOTFOUND api.stripe.com
```

**Solutions:**
1. Check DNS configuration
2. Use alternative DNS servers
3. Add hosts file entries if needed
4. Verify network connectivity

### Performance Issues

#### Memory Leaks
```
Error: JavaScript heap out of memory
```

**Diagnosis:**
```bash
# Monitor memory usage
ps aux | grep migration
node --max-old-space-size=4096 index.ts
```

**Solutions:**
1. Reduce batch size and concurrency
2. Implement garbage collection hints
3. Add memory monitoring
4. Restart migration periodically

#### Slow Processing
```
Rate: 0.1/s (expected: 2-5/s)
```

**Diagnosis Checklist:**
- [ ] Network latency to APIs
- [ ] Database query performance
- [ ] System resource utilization
- [ ] Rate limiting configuration
- [ ] Concurrent operation conflicts

**Optimization Steps:**
1. Profile database queries
2. Optimize network settings
3. Tune batch sizes
4. Implement caching where appropriate

## Data Quality Issues

### Validation Failures

#### Missing Required Fields
```
Error: VALIDATION_ERROR - Product title is required
```

**Data Cleanup Query:**
```sql
-- Find products with missing titles
SELECT id, title, description 
FROM products 
WHERE title IS NULL OR title = '';

-- Find products with invalid prices
SELECT id, title, price 
FROM products 
WHERE price IS NULL OR price = '' OR price = '0';
```

#### Invalid Image URLs
```
Error: VALIDATION_ERROR - Invalid image URL format
```

**Cleanup Script:**
```sql
-- Find invalid image URLs
SELECT id, title, image 
FROM products 
WHERE image IS NOT NULL 
AND image NOT LIKE 'http%';

-- Update invalid URLs
UPDATE products 
SET image = NULL 
WHERE image IS NOT NULL 
AND image NOT LIKE 'http%';
```

### Duplicate Products

#### Stripe Duplicate Detection
```
Error: STRIPE_INVALID_REQUEST - Product with this name already exists
```

**Solutions:**
1. Enable skip existing: `MIGRATION_SKIP_EXISTING=true`
2. Add unique suffixes to product names
3. Implement deduplication logic

## Recovery Procedures

### Partial Migration Failure

#### Resume from Checkpoint
```bash
# Check last checkpoint
ls -la checkpoints/

# Resume migration
npm run migrate:resume
```

#### Manual Recovery
```bash
# Find last successfully processed product
grep "Product migration completed" logs/migration-*.log | tail -1

# Update checkpoint manually if needed
# Edit checkpoints/migration-checkpoint-YYYY-MM-DD.json
```

### Data Corruption Recovery

#### Restore from Backup
```bash
# List available backups
ls -la backups/

# Restore specific backup
# Use your database restoration tools
```

#### Selective Rollback
```sql
-- Remove Stripe IDs for failed products
UPDATE products 
SET stripe_product_id = NULL, 
    stripe_price_id = NULL, 
    sync_status = 'pending' 
WHERE sync_status = 'failed';
```

### Complete Migration Reset

#### Clean Slate Reset
```sql
-- Reset all migration data
UPDATE products 
SET stripe_product_id = NULL, 
    stripe_price_id = NULL, 
    sync_status = 'pending', 
    last_synced_at = NULL;
```

```bash
# Clear checkpoints
rm -rf checkpoints/*

# Clear logs (optional)
rm -rf logs/*

# Restart migration
npm run migrate
```

## Monitoring and Alerting

### Key Metrics to Monitor

#### Success Rate
```bash
# Calculate success rate from logs
grep "Product migration completed" logs/migration-*.log | wc -l
grep "Product processing failed" logs/migration-*.log | wc -l
```

#### Processing Rate
```bash
# Monitor processing rate
grep "Progress:" logs/migration-*.log | tail -10
```

#### Error Distribution
```bash
# Count error types
grep "ERROR" logs/migration-*.log | \
  grep -o 'code":"[^"]*' | \
  cut -d'"' -f3 | \
  sort | uniq -c | sort -nr
```

### Automated Monitoring

#### Health Check Script
```bash
#!/bin/bash
# health-check.sh

LOG_FILE="logs/migration-$(date +%Y-%m-%d).log"

# Check if migration is running
if ! pgrep -f "migration" > /dev/null; then
    echo "ALERT: Migration process not running"
    exit 1
fi

# Check error rate
ERROR_COUNT=$(grep "ERROR" "$LOG_FILE" | wc -l)
TOTAL_COUNT=$(grep "Processing product" "$LOG_FILE" | wc -l)

if [ $TOTAL_COUNT -gt 0 ]; then
    ERROR_RATE=$(echo "scale=2; $ERROR_COUNT * 100 / $TOTAL_COUNT" | bc)
    if (( $(echo "$ERROR_RATE > 5" | bc -l) )); then
        echo "ALERT: High error rate: $ERROR_RATE%"
        exit 1
    fi
fi

echo "OK: Migration healthy"
```

#### Log Rotation
```bash
# Add to crontab for daily log rotation
0 0 * * * find /path/to/logs -name "migration-*.log" -mtime +7 -delete
```

## Emergency Procedures

### Immediate Stop
```bash
# Graceful shutdown (recommended)
pkill -SIGTERM -f "migration"

# Force stop (if graceful fails)
pkill -SIGKILL -f "migration"
```

### Service Recovery
```bash
# Check service status
systemctl status migration-service

# Restart service
systemctl restart migration-service

# Check logs
journalctl -u migration-service -f
```

### Escalation Checklist

When to escalate to senior team:

- [ ] Critical errors affecting >10% of products
- [ ] Data corruption detected
- [ ] Service unavailable for >30 minutes
- [ ] Security-related errors
- [ ] Unexpected Stripe charges

### Contact Information

**Internal Escalation:**
- DevOps Team: devops@company.com
- Database Admin: dba@company.com
- Security Team: security@company.com

**External Support:**
- Stripe Support: https://support.stripe.com
- Supabase Support: https://supabase.com/support

## Prevention Strategies

### Pre-Migration Checklist

- [ ] Data quality validation
- [ ] Backup verification
- [ ] Rate limit testing
- [ ] Network stability check
- [ ] Resource capacity planning
- [ ] Rollback procedure testing

### Ongoing Maintenance

- [ ] Regular log review
- [ ] Performance monitoring
- [ ] Data integrity checks
- [ ] Security audit
- [ ] Documentation updates

Remember: Always test recovery procedures in a non-production environment before running in production.