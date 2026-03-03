# Health Aggregator Service

Centralized health monitoring service for AndikishaHR microservices architecture.

## Overview

The Health Aggregator Service polls all registered services periodically, aggregates their health status, and provides:

- **Centralized Dashboard API** - Query aggregate health status across all services
- **Prometheus Metrics** - Export health metrics for monitoring and alerting
- **Historical Data** - Store and query health check history
- **System Health Score** - Calculate overall system health (0-100%)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Kubernetes Cluster                          │
│                                                               │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐             │
│  │API Gateway  │Auth Service│  │Employee Svc  │             │
│  │/health      │/health      │  │/health       │ ◄── K8s Probes
│  │/health/live │/health/live │  │/health/live  │    (Direct)
│  │/health/ready│/health/ready│  │/health/ready │             │
│  └──────┬──────┘──────┬──────┘──┘──────┬───────┘             │
│         │             │                │                      │
│         └─────────────┴────────────────┘                      │
│                       │                                       │
│                       │ HTTP polls every 10s                  │
│                  ┌────▼───────────┐                           │
│                  │Health           │                           │
│                  │Aggregator       │                           │
│                  │Service          │                           │
│                  │                 │                           │
│                  │/aggregate       │                           │
│                  │/health          │                           │
│                  │/metrics         │                           │
│                  └────────┬────────┘                           │
└───────────────────────────┼────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │Prometheus +   │
                    │Grafana        │
                    └───────────────┘
```

## Key Features

### 1. Automatic Service Discovery
- Configured via `src/config/services.config.ts`
- Add new services by updating the service registry
- Per-service poll intervals and timeouts

### 2. Periodic Health Polling
- Polls all enabled services every 10 seconds
- Configurable timeout (default: 5 seconds)
- Parallel polling for efficiency
- Automatic retry on failure

### 3. Health Aggregation
- Calculates overall system health score (0-100%)
- Determines system status: healthy, degraded, or unhealthy
- Tracks critical vs non-critical services
- Provides per-service health status

### 4. Historical Data Storage
- In-memory storage (default)
- Stores up to 1,000 snapshots per service
- Query health history for any time range
- Calculate uptime and average response times

### 5. Prometheus Metrics
- Service health status gauges
- System health score
- Health check success/failure counters
- Response time metrics
- Service count metrics

### 6. REST API
- Query aggregate health
- Get specific service health
- View health history
- Trigger manual health checks
- Get storage statistics

## API Endpoints

### Health Endpoints (for the aggregator itself)

- `GET /health` - Overall health status
- `GET /health/live` - Liveness probe (Kubernetes)
- `GET /health/ready` - Readiness probe (Kubernetes)

### Aggregate Endpoints

- `GET /aggregate` - Aggregate health of all services
- `GET /aggregate/status` - Simplified system status
- `GET /aggregate/services` - List of monitored services
- `GET /aggregate/services/:name` - Specific service health
- `GET /aggregate/services/:name/history?hours=24` - Service health history
- `GET /aggregate/services/:name/check` - Manual health check
- `GET /aggregate/stats` - Storage statistics

### Metrics

- `GET /metrics` - Prometheus metrics

## Configuration

### Environment Variables

See `.env.example` for all configuration options:

```bash
# Server
PORT=3010
NODE_ENV=development

# Polling
HEALTH_POLL_INTERVAL=10000        # 10 seconds
HEALTH_CHECK_TIMEOUT=5000         # 5 seconds

# Storage
STORAGE_TYPE=memory               # Options: memory, redis

# Service URLs
API_GATEWAY_URL=http://localhost:3000
AUTH_SERVICE_URL=http://localhost:3002
EMPLOYEE_SERVICE_URL=http://localhost:3001
```

### Service Registry

Edit `src/config/services.config.ts` to add/modify monitored services:

```typescript
export const SERVICE_REGISTRY: ServiceRegistryEntry[] = [
  {
    name: 'api-gateway',
    displayName: 'API Gateway',
    healthUrl: 'http://api-gateway:3000/health',
    protocol: 'http',
    port: 3000,
    enabled: true,
    pollInterval: 10000,
    timeout: 5000,
    criticalService: true
  },
  // ... more services
];
```

## Development

### Prerequisites

- Node.js 18+
- pnpm
- Running services to monitor (API Gateway, Auth Service, Employee Service)

### Install Dependencies

```bash
pnpm install
```

### Start Development Server

```bash
# From project root
pnpm dev:health

# Or from this directory
pnpm dev
```

The service will start on http://localhost:3010

### Test Endpoints

```bash
# Check aggregator health
curl http://localhost:3010/health

# Get aggregate health status
curl http://localhost:3010/aggregate

# Get system status
curl http://localhost:3010/aggregate/status

# Get specific service health
curl http://localhost:3010/aggregate/services/auth-service

# Trigger manual health check
curl http://localhost:3010/aggregate/services/auth-service/check

# View Prometheus metrics
curl http://localhost:3010/metrics
```

## Deployment

### Docker

```bash
# Build image
docker build -t andikisha/health-aggregator:latest .

# Run container
docker run -p 3010:3010 \
  -e API_GATEWAY_URL=http://api-gateway:3000 \
  -e AUTH_SERVICE_URL=http://auth-service:3002 \
  -e EMPLOYEE_SERVICE_URL=http://employee-service:3001 \
  andikisha/health-aggregator:latest
```

### Kubernetes

See `k8s-deployment-example.yaml` for full deployment configuration.

```bash
kubectl apply -f k8s-deployment-example.yaml
```

The deployment includes:
- 2 replicas (auto-scales 2-5)
- Liveness and readiness probes
- Resource limits (128Mi-256Mi RAM, 100m-200m CPU)
- Prometheus annotations for scraping
- Service endpoints on ports 3010 (HTTP) and 9090 (metrics)

## Prometheus Integration

### Metrics Exported

**Service Health Status**
- `service_health_status{service_name, critical}` - 1=healthy, 0=unhealthy

**System Health**
- `system_health_score{environment}` - Overall health score (0-100)
- `total_services_monitored` - Total services being monitored
- `healthy_services_count` - Number of healthy services
- `unhealthy_services_count` - Number of unhealthy services

**Health Checks**
- `health_check_success_total{service_name}` - Successful health checks
- `health_check_failures_total{service_name, error_type}` - Failed health checks
- `service_health_check_response_time_ms{service_name}` - Response time

### Example PromQL Queries

```promql
# Overall system health score
system_health_score

# Services currently unhealthy
service_health_status == 0

# Health check failure rate
rate(health_check_failures_total[5m])

# Average response time by service
avg(service_health_check_response_time_ms) by (service_name)
```

### Grafana Dashboard

Create alerts based on:
- System health score < 70%
- Any critical service unhealthy
- Health check failure rate > 10%
- Response time > 1000ms

## Monitoring

### Health Check Flow

1. **Polling Service** runs every 10 seconds (cron job)
2. Polls all enabled services in parallel
3. Stores results in **Storage Service**
4. **Metrics Updater** updates Prometheus metrics
5. **Aggregator Service** provides query API

### Storage

Default: In-memory storage (up to 1,000 snapshots per service)

For production:
- Use Redis for distributed storage
- Configure via `STORAGE_TYPE=redis`
- Set `REDIS_URL` environment variable

## Troubleshooting

### Service Not Being Monitored

1. Check if service is enabled in `services.config.ts`
2. Verify service URL is correct
3. Check logs: `docker logs health-aggregator`

### High Memory Usage

- Reduce `maxSnapshotsPerService` in `storage.service.ts`
- Use Redis storage instead of in-memory
- Increase memory limits in Kubernetes

### Health Checks Timing Out

- Increase `HEALTH_CHECK_TIMEOUT`
- Check network connectivity to services
- Verify services are responding to `/health` endpoints

## Architecture Decisions

### Why Not Replace Individual Health Endpoints?

Kubernetes **requires** direct pod-level health checks. A separate health service cannot replace this because:
- If the aggregator goes down, all health checks fail
- Network calls add latency and failure points
- Kubernetes can't determine which specific pod is unhealthy

**Solution**: Keep individual health endpoints for Kubernetes probes, use aggregator for monitoring dashboard.

### Why Poll Instead of Push?

- Simpler implementation (no service dependencies)
- Services don't need to know about aggregator
- Works with existing health endpoints
- Easy to add new services

### Why In-Memory Storage?

- Fast and simple
- No external dependencies
- Sufficient for recent history
- Can upgrade to Redis/database if needed

## Future Enhancements

- [ ] Dashboard UI (React/Vue frontend)
- [ ] WebSocket support for real-time updates
- [ ] Alert configuration and notifications
- [ ] Health check history database storage
- [ ] Service dependency graph visualization
- [ ] Incident timeline and reporting
- [ ] Multi-region health aggregation

## Related Documentation

- [Health Check Library (`@andikisha/health`)](/libs/health/)
- [API Gateway Health Checks](/services/api-gateway/src/health/)
- [Kubernetes Deployment Example](/k8s-deployment-example.yaml)
- [Prometheus Metrics Guide](/docs/PROMETHEUS_METRICS.md)

## License

UNLICENSED - AndikishaHR Internal Use Only
