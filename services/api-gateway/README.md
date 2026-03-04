# API Gateway — AndikishaHR

The HTTP entry point for the AndikishaHR platform. All client traffic flows through this service, which authenticates requests, resolves tenant context, enforces rate limits, and proxies operations to backend microservices via gRPC.

**Framework**: NestJS v11 | **Port**: `3000`

---

## Architecture

```
Client → API Gateway (HTTP :3000)
              │
              ├── Local JWT validation (no gRPC round-trip)
              ├── Redis token cache (SHA-256 keyed, 5 min TTL)
              ├── Tenant middleware (X-Tenant-ID header / subdomain)
              ├── Rate limiter (100 req/60s global, 5 req/60s auth)
              │
              ├── gRPC → Auth Service       (:5002)
              └── gRPC → Employee Service   (:5001)
```

---

## API Endpoints

### Auth — `POST /auth/*`

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| `POST` | `/auth/register` | Public | 5/min | Register a new user |
| `POST` | `/auth/login` | Public | 5/min | Login and receive JWT tokens |
| `POST` | `/auth/refresh` | Public | — | Refresh access token |
| `POST` | `/auth/logout` | Required | — | Revoke tokens and destroy session |

### Employees — `GET|POST|PUT|DELETE /employees/*`

All employee routes require a valid JWT and `X-Tenant-ID` header.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/employees` | Create employee |
| `GET` | `/employees` | List employees (pagination + filters) |
| `GET` | `/employees/:id` | Get employee by ID |
| `GET` | `/employees/number/:employeeNumber` | Get employee by employee number |
| `PUT` | `/employees/:id` | Update employee |
| `DELETE` | `/employees/:id` | Terminate employee |

### Observability

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | Public | Full health status (Redis, gRPC, memory) |
| `GET` | `/health/live` | Public | Liveness probe — is the process alive? |
| `GET` | `/health/ready` | Public | Readiness probe — can traffic be served? |
| `GET` | `/metrics` | Public | Prometheus metrics scrape endpoint |
| `GET` | `/metrics/health` | Public | Metrics subsystem health check |
| `GET` | `/api/docs` | Public | Swagger UI (non-production only) |

---

## Configuration

Create a `.env` file in this directory:

```env
# Server
NODE_ENV=development
PORT=3000

# JWT — must match the secret used in auth-service
JWT_SECRET=your-secret-here
JWT_ACCESS_TOKEN_EXPIRATION=15m

# gRPC backends
AUTH_GRPC_URL=localhost:5002
EMPLOYEE_GRPC_URL=localhost:5001

# Redis (used for JWT token cache and rate limiting)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123

# Rate limiting
RATE_LIMIT_TTL=60      # window in seconds
RATE_LIMIT_MAX=100     # max requests per window

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:3000,http://localhost:4200
```

---

## Request Flow

### Authentication

JWT validation happens **locally** in the API Gateway using the shared `JWT_SECRET` — no gRPC call is made to the Auth Service on every request. Validated payloads are cached in Redis for 5 minutes (keyed by SHA-256 of the token).

```
Request with Bearer token
  → Check Redis cache (sha256(token))
    → Cache hit:  use cached payload (<1ms)
    → Cache miss: verify JWT locally, store in Redis
  → Attach user to request (id, email, tenantId, roles, permissions)
```

Public routes (register, login, refresh, health, metrics) bypass this flow via the `@Public()` decorator.

### Multi-Tenancy

The `TenantMiddleware` resolves tenant context on every request in priority order:

1. `X-Tenant-ID` request header _(primary)_
2. URL path parameter (`:tenantId`)
3. Subdomain (e.g. `acme.andikishaHR.com` → `acme`)

Non-auth routes without a resolvable tenant ID return `400 Bad Request`.

---

## Local Development

```bash
# From the monorepo root — start infrastructure first
pnpm docker:up

# Start the API Gateway in watch mode
pnpm dev:gateway

# Or from this directory
pnpm dev
```

Swagger UI is available at `http://localhost:3000/api/docs` when `NODE_ENV != production`.

---

## Commands

```bash
pnpm dev              # Start in watch mode
pnpm build            # Compile TypeScript
pnpm start            # Run compiled output
pnpm start:debug      # Start with Node debugger attached
pnpm test             # Run unit tests
pnpm test:cov         # Run tests with coverage report
pnpm lint             # Lint and auto-fix
pnpm format           # Prettier format
```

---

## Health Checks

The `/health/ready` endpoint checks:
- Redis connectivity
- Heap memory < 400 MB
- Auth Service gRPC reachable
- Employee Service gRPC reachable

The `/health/live` endpoint returns `200 OK` as long as the process is running — used by Kubernetes to decide whether to restart the pod.

---

## Prometheus Metrics

The `/metrics` endpoint exposes the following custom counters and histograms:

| Metric | Type | Labels |
|--------|------|--------|
| `http_requests_total` | Counter | `method`, `route`, `status` |
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status` |
| `auth_requests_total` | Counter | `status` |
| `cache_operations_total` | Counter | `operation`, `result` |
| `grpc_client_calls_total` | Counter | `service`, `method` |

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@nestjs/jwt` | Local JWT verification |
| `@nestjs/terminus` | Health check endpoints |
| `@willsoto/nestjs-prometheus` | Prometheus metrics |
| `@nestjs/throttler` | Rate limiting |
| `@nestjs/swagger` | OpenAPI documentation |
| `helmet` | HTTP security headers |
| `compression` | Response compression |
| `@andikisha/common` | Shared config validation, Redis cache module |