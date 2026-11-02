# Monitoring Baseline - dracinhub

**Document Version**: 1.0  
**Last Updated**: 2026-02-24  
**Status**: Production Baseline

---

## Overview

This document defines the operational baseline metrics, alert thresholds, and monitoring strategy for the dracinhub platform. All metrics are mapped to existing logging fields for consistent observability.

---

## Key Performance Indicators (KPIs)

### API Response Latency

| Endpoint | P50 Target | P95 Target | P99 Target | Alert Threshold |
|----------|------------|------------|-------------|-----------------|
| `GET /api/v1/home` | < 100ms | < 200ms | < 500ms | P95 > 500ms |
| `GET /api/v1/search` | < 300ms | < 800ms | < 1500ms | P95 > 1500ms |
| `GET /api/v1/playback` | < 200ms | < 500ms | < 1000ms | P95 > 1000ms |
| `GET /api/v1/dramas/{id}` | < 50ms | < 100ms | < 200ms | P95 > 200ms |
| `GET /api/v1/dramas/{id}/episodes` | < 100ms | < 200ms | < 400ms | P95 > 400ms |
| `POST /api/v1/watch/progress` | < 50ms | < 100ms | < 200ms | P95 > 200ms |

**Logging Field**: `latencyMs` in all API route logs

### Cache Performance

| Cache Type | Hit Rate Target | Alert Threshold | TTL |
|------------|-----------------|-----------------|-----|
| Search Results | > 75% | < 60% | 24h (86400s) |
| Playback URLs | > 80% | < 70% | 90s |
| Provider Catalog | > 95% | < 90% | 1h (3600s) |
| Episode Lists | > 70% | < 50% | 2h (7200s) |

**Logging Field**: `cache: 'hit' | 'miss'` in response meta

### Error Rates

| Category | Target | Warning | Critical |
|----------|--------|---------|----------|
| Overall Error Rate | < 0.5% | > 1% | > 5% |
| 4xx Errors | < 2% | > 5% | > 10% |
| 5xx Errors | < 0.1% | > 0.5% | > 1% |
| Provider Errors | < 1% | > 3% | > 5% |

**Logging Field**: `statusCode` and `error.code` in API response logs

---

## Provider Health Metrics

### Per-Provider Monitoring

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Availability | > 99% | < 98% | < 95% |
| P95 Latency | < 1000ms | > 2000ms | > 5000ms |
| Error Rate | < 1% | > 3% | > 5% |
| Rate Limit Hits | < 5% | > 10% | > 20% |

**Logging Fields**: 
- `provider` in all provider-related logs
- `error.code === 'RATE_LIMITED'` for rate limit events

### Provider Status Tracking

Providers have three status states in the database:
- `active` - Normal operation
- `maintenance` - Temporarily disabled for maintenance
- `disabled` - Permanently disabled due to issues

**Database Field**: `providers.status`

---

## Rate Limiting Metrics

### Global Rate Limits

| Metric | Default | Alert Threshold |
|--------|---------|-----------------|
| Global RPM | 45 req/min | > 50 req/min |
| Per-Provider RPM | 10 req/min | > 12 req/min |

**Configuration**: `RATE_LIMIT_GLOBAL_RPM` and `RATE_LIMIT_PROVIDER_RPM` env vars

**Logging Field**: `error.code === 'RATE_LIMITED'`

---

## Data Synchronization Metrics

### Cron Job Performance

| Job | Schedule | Target Duration | Alert Threshold |
|-----|----------|-----------------|-----------------|
| `sync-providers` | Every 6h | < 30s | > 60s |
| `sync-dramas` | Every 2h | < 45s | > 90s |

**Logging Fields**:
- `cron_sync_providers_started/completed/failed`
- `cron_sync_dramas_started/completed/failed`
- `latencyMs` for duration

### Data Freshness

| Data Type | Max Age | Alert Threshold |
|-----------|---------|-----------------|
| Provider Catalog | 6 hours | > 12 hours |
| Home Dramas | 2 hours | > 4 hours |
| Episode Lists | 2 hours | > 6 hours |

**Database Field**: `last_synced_at` on providers and dramas tables

---

## Alert Definitions

### Critical Alerts (Immediate Response Required)

| Alert | Condition | Response |
|-------|-----------|----------|
| `provider_down` | Provider availability < 95% for > 5 min | Disable provider, investigate |
| `playback_failure_spike` | Playback success rate < 90% for > 2 min | Check upstream APIs |
| `database_connection_error` | Any DB connection failure | Check Supabase status |
| `redis_connection_error` | Any Redis connection failure | Check Upstash status |
| `error_rate_critical` | Overall error rate > 5% for > 5 min | Investigate logs, scale if needed |

### Warning Alerts (Investigation Required)

| Alert | Condition | Response |
|-------|-----------|----------|
| `latency_degraded` | P95 latency > target for > 10 min | Check cache, DB queries |
| `cache_hit_low` | Cache hit ratio < target for > 15 min | Check Redis, TTL settings |
| `provider_errors` | Provider error rate > 3% for > 10 min | Monitor, consider disable |
| `rate_limit_warning` | Rate limit hits > 10% for > 5 min | Consider increasing limits |

---

## Logging Schema Reference

### Standard Log Fields

All logs include these base fields:

```json
{
  "level": "INFO" | "WARN" | "ERROR",
  "timestamp": "2026-02-24T10:00:00Z",
  "message": "event_name",
  "requestId": "uuid-v4"
}
```

### API Event Types

| Event | Additional Fields |
|-------|-------------------|
| `search_completed` | `query`, `count`, `latencyMs`, `cache` |
| `search_failed` | `query`, `error`, `latencyMs` |
| `playback_completed` | `provider`, `dramaId`, `episodeId`, `latencyMs`, `cache` |
| `playback_failed` | `provider`, `dramaId`, `episodeId`, `error`, `latencyMs` |
| `playback_entitlement_denied` | `userId`, `dramaId`, `reason` |
| `watch_progress_saved` | `userId`, `dramaId`, `episodeId`, `progressSeconds`, `isCompleted` |
| `watch_progress_failed` | `userId`, `dramaId`, `episodeId`, `error` |
| `drama_detail_fetched` | `dramaId`, `latencyMs` |
| `episodes_fetched` | `dramaId`, `count`, `latencyMs` |

### Cron Event Types

| Event | Additional Fields |
|-------|-------------------|
| `cron_sync_providers_started` | - |
| `cron_sync_providers_completed` | `latencyMs` |
| `cron_sync_providers_failed` | `error`, `latencyMs` |
| `cron_sync_dramas_started` | - |
| `cron_sync_dramas_completed` | `latencyMs` |
| `cron_sync_dramas_failed` | `error`, `latencyMs` |

---

## Dashboard Queries

### P95 Latency (Last Hour)

```sql
-- This would be implemented in your monitoring tool
-- Example for log-based analysis:
SELECT 
  percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency,
  endpoint
FROM log_events
WHERE timestamp > now() - interval '1 hour'
GROUP BY endpoint;
```

### Error Rate (Last 15 Minutes)

```sql
SELECT 
  COUNT(CASE WHEN error_code IS NOT NULL THEN 1 END) as errors,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(CASE WHEN error_code IS NOT NULL THEN 1 END) / COUNT(*), 2) as error_rate
FROM log_events
WHERE timestamp > now() - interval '15 minutes';
```

### Cache Hit Ratio (Last Hour)

```sql
SELECT 
  COUNT(CASE WHEN cache = 'hit' THEN 1 END) as hits,
  COUNT(CASE WHEN cache IS NOT NULL THEN 1 END) as total,
  ROUND(100.0 * COUNT(CASE WHEN cache = 'hit' THEN 1 END) / COUNT(CASE WHEN cache IS NOT NULL THEN 1 END), 2) as hit_rate
FROM log_events
WHERE timestamp > now() - interval '1 hour'
  AND cache IS NOT NULL;
```

---

## External Dependencies

### Required Monitoring Setup (External Actions)

These require configuration in external services:

1. **Vercel Log Drains** - Configure to send logs to monitoring service
   - Options: Datadog, Logz.io, New Relic, Custom endpoint
   - Action required: Configure in Vercel dashboard

2. **Supabase Monitoring** - Enable built-in monitoring
   - Database metrics, connection pooling stats
   - Action required: Enable in Supabase dashboard

3. **Upstash Redis Monitoring** - Enable metrics
   - Cache hit rates, connection counts
   - Action required: Enable in Upstash dashboard

4. **Alerting Channels** - Configure notification endpoints
   - Slack, PagerDuty, Email
   - Action required: Configure in monitoring service

---

## Runbook References

### Common Incident Responses

1. **High Error Rate**
   - Check recent deployments
   - Review error logs for patterns
   - Check external API status pages
   - Consider rollback if deployment-related

2. **Cache Hit Rate Low**
   - Check Redis connection status
   - Verify TTL configurations
   - Check for cache key changes
   - Consider cache warming

3. **Provider Down**
   - Set provider status to `maintenance` in DB
   - Investigate provider API status
   - Check rate limit status
   - Re-enable when resolved

4. **Rate Limit Exceeded**
   - Check traffic patterns for anomalies
   - Consider temporary limit increase
   - Implement request queuing if sustained

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-24 | Initial baseline documentation |

---

**Next Review Date**: 2026-03-24  
**Document Owner**: techprocreative