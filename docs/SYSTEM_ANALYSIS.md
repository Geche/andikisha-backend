# AndikishaHR — End-to-End System Analysis

**Date**: 2026-03-03
**Scope**: Full codebase — 4 services, 6 shared libraries, proto definitions, infrastructure, documentation
**Method**: Every source file read and analysed across `services/`, `libs/`, `proto/`, `docker/`, `docs/`

---

## 1. System Goals & Problem It Solves

### The Problem
African businesses — especially in Kenya, Uganda, and Tanzania — lack affordable,
locally-compliant HR and payroll software. Existing tools (SAP, ADP) are designed for
Western markets and do not support:
- Kenyan statutory deductions: PAYE, NSSF, NHIF/SHA, Housing Levy
- KRA iTax filing
- M-PESA payroll disbursement
- Africa's Talking SMS for payslip delivery
- African currencies, timezones, and fiscal year configurations

### The Solution
AndikishaHR is a multi-tenant SaaS platform that manages the full employee lifecycle
from onboarding through payroll to regulatory compliance — built specifically for
African regulatory and infrastructure requirements.

### Target Market
- SMEs to enterprises in Kenya (primary), Uganda, Tanzania (secondary)
- Tiered subscription: STARTER (1–10), GROWTH (11–50), PROFESSIONAL (51–200),
  ENTERPRISE (200+), UNLIMITED

---

## 2. Architecture Overview

```
CLIENT (Browser / Mobile)
        │  HTTP/REST
        ▼
┌───────────────────────────────────────────────────────┐
│  API GATEWAY  :3000                                   │
│  • JWT local validation (Redis cached, <1ms)          │
│  • Tenant middleware (header / subdomain / path)      │
│  • Rate limiting (ThrottlerGuard, 100 req/60s)        │
│  • Helmet, CORS, Compression                          │
│  • Swagger UI (/api/docs)                             │
│  • Prometheus metrics (/metrics)                      │
│  • Health probes (/health, /health/live, /health/ready)│
└──────┬──────────────────────────┬─────────────────────┘
       │  gRPC                    │  gRPC
       ▼                          ▼
┌──────────────┐         ┌────────────────────┐
│ AUTH SERVICE │         │  EMPLOYEE SERVICE  │
│  :5002 gRPC  │         │   :5001 gRPC       │
│              │         │                    │
│ • Register   │         │ • Employee CRUD    │
│ • Login      │         │ • Departments      │
│ • Refresh    │         │ • Positions        │
│ • Logout     │         │ • Emergency Contacts│
│ • RBAC       │         │ • Bank Accounts    │
│ • Sessions   │         │ • Soft-delete      │
└──────┬───────┘         └──────┬─────────────┘
       │                        │
       └───────────┬────────────┘
                   ▼
┌─────────────────────────────────────────────────────┐
│  SHARED INFRASTRUCTURE                              │
│  PostgreSQL :5432   — two databases (auth, employee)│
│  Redis      :6379   — JWT cache + data cache (5min) │
│  RabbitMQ   :5672   — event bus (defined, unused)   │
│  MinIO      :9000   — file storage (schema only)    │
└─────────────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────┐
│  HEALTH AGGREGATOR :3010 │
│  Polls all services,     │
│  exposes aggregated      │
│  health + Prometheus     │
└──────────────────────────┘
```

### Communication Patterns

| Pattern | Used For | Status |
|---|---|---|
| REST/HTTP | Client ↔ API Gateway | ✅ Active |
| gRPC (unary) | API Gateway ↔ Services | ✅ Active |
| RabbitMQ (pub/sub) | Async events between services | ⚠️ Defined, never published |
| Redis cache | JWT tokens, tenant data | ✅ Active |
| MinIO (S3) | Document file storage | ⚠️ Schema exists, no service |

### Port Reference

| Service | HTTP | gRPC |
|---|---|---|
| API Gateway | 3000 | — |
| Auth Service | 3002 | 5002 |
| Employee Service | 3001 | 5001 |
| Payroll Service *(future)* | 3003 | 5003 |
| Compliance Service *(future)* | 3004 | 5004 |
| Health Aggregator | 3010 | — |
| PostgreSQL | 5432 | — |
| Redis | 6379 | — |
| RabbitMQ | 5672 / 15672 UI | — |
| MinIO | 9000 / 9001 UI | — |

---

## 3. User Types & Workflows

### Roles (seeded at startup by `RoleService.createDefaultSystemRoles()`)

| Role | Primary Capabilities |
|---|---|
| `admin` | Full system access across all modules |
| `hr_manager` | Employee CRUD, departments, positions, documents |
| `payroll_officer` | Payroll processing, statutory reports, disbursements |
| `employee` | Self-service: view payslip, apply for leave, update profile |

### Core Workflows (Implemented)

**Authentication Flow**
```
Client → POST /auth/login { tenant_id, email, password }
       → API Gateway (gRPC) → Auth Service
       → bcrypt password verify → JWT pair generated (access 15m, refresh 7d)
       → { access_token, refresh_token, expires_in, user }
Next requests:
       → API Gateway validates JWT locally via JwtValidationService
       → Redis cache check first (5-min TTL) → <1ms per validation
```

**Employee Onboarding Flow**
```
HR Manager → POST /employees { ...employee data }
           → API Gateway: validate JWT + extract tenantId
           → gRPC → Employee Service
           → Prisma transaction: validate manager + dept + position → create employee
           → Default status: PROBATION
           → Returns full employee with all relations
```

**Token Refresh Flow**
```
Client → POST /auth/refresh { refresh_token }
       → Auth Service: verify JWT → DB check (not revoked, not expired)
       → Prisma transaction: revoke old token → issue new pair
```

### Missing Workflows (To Build)

| Workflow | Depends On |
|---|---|
| Payroll run → PAYE/NSSF/NHIF calculation | Payroll Service |
| Payslip PDF generation → MinIO | Document Service + Payroll |
| M-PESA bulk disbursement | Payroll Service + M-PESA integration |
| KRA iTax P9 form generation | Compliance Service |
| Leave request → manager approval | Leave Service |
| Attendance check-in/out | Attendance Service |
| SMS payslip delivery | Africa's Talking integration |
| Email notifications | SendGrid integration |

---

## 4. What Has Been Built

### ✅ API Gateway — Complete

Every layer is implemented and production-grade:

| Component | File | What It Does |
|---|---|---|
| Bootstrap | `main.ts` | Helmet, CORS, compression, global ValidationPipe, Swagger |
| Auth Guard | `common/guards/auth.guard.ts` | Local JWT validation, Redis caching, @Public() decorator |
| JWT Service | `common/services/jwt-validation.service.ts` | Signature verify, expiry check, RBAC helpers |
| Tenant Middleware | `common/middleware/tenant.middleware.ts` | X-Tenant-ID → subdomain → path, attaches to req |
| Exception Filter | `common/filters/http-exception.filter.ts` | Maps gRPC codes to HTTP, structured error response |
| Logging Interceptor | `common/interceptors/logging.interceptor.ts` | Request/response logs with tenant + user context |
| Timeout Interceptor | `common/interceptors/timeout.interceptor.ts` | 30s global timeout via RxJS |
| Metrics Interceptor | `common/interceptors/metrics.interceptor.ts` | Prometheus counter + histogram per route |
| Auth Controller | `modules/auth/auth.controller.ts` | 4 HTTP endpoints → gRPC |
| Employee Controller | `modules/employee/employee.controller.ts` | 6 HTTP endpoints → gRPC |
| gRPC Config | `config/grpc.config.ts` | Auth + Employee client options with keepalive |
| Health Module | `health/` | /health, /health/live, /health/ready (K8s-ready) |
| Metrics Module | `metrics/` | 6 custom Prometheus metrics + /metrics endpoint |

### ✅ Auth Service — Complete

| Component | Details |
|---|---|
| `AuthService` | 6 gRPC methods; register, login, refresh, validate, logout, getUserById |
| `UserService` | 12 methods: CRUD, password validation, role assignment, permissions |
| `UserRepository` | 14 methods; all accept optional `tx` parameter for transaction support |
| `RoleService` | Seeds system roles on startup; tenant + system role queries |
| `JwtService` (custom) | Generates access (15m) + refresh (7d) tokens with `type` claim |
| `HashService` | bcrypt (10 rounds); ⚠️ `Math.random()` for token generation (bug) |
| Prisma Schema | User, Role, Permission, UserRole, RolePermission, Session, RefreshToken |

**All critical paths are transactional:**
- `register()` → user creation + role assignment
- `login()` → token storage + lastLogin + session creation
- `refreshToken()` → old token revoke + new token store
- `logout()` → all refresh tokens revoke + session delete

### ✅ Employee Service — Complete

| Component | Details |
|---|---|
| `EmployeeService` | 6 methods (CRUD + list); createEmployee is fully transactional |
| `EmployeeRepository` | 12 methods; parallel count+fetch via `Promise.all` |
| `EmployeeController` | 30+ `@GrpcMethod` handlers for all entities |
| Departments | Full CRUD; hierarchical via `parentId` self-reference |
| Positions | Salary ranges (Decimal 15,2), level, department affiliation |
| Emergency Contacts | Multiple per employee; `isPrimary` flag |
| Bank Accounts | Multi-currency, SWIFT code, `isPrimary` flag |
| Employment History | Immutable audit log (HIRE, PROMOTION, TRANSFER, TERMINATION, etc.) |
| Documents | `fileUrl` stored (MinIO path); no upload service yet |
| Prisma Schema | 8 models, 7 enums, 15+ composite indexes |

**Employee deletion is a soft-delete**: sets `employmentStatus = TERMINATED` with `terminationDate` and `terminationReason`.

### ✅ Shared Libraries — All Implemented

| Library | Key Exports |
|---|---|
| `@andikisha/common` | `RedisCacheModule`, `CacheService` (cache-aside), `validationSchema` (Joi), `@CurrentTenant`, `@TenantId`, `PaginationDto`, `Tenant` interface |
| `@andikisha/database` | `PrismaService` — 50-connection pool, slow query detection (>100ms), `isHealthy()`, graceful shutdown hooks |
| `@andikisha/rabbitmq` | `RabbitMQService` — `emit()` fire-and-forget, `send()` RPC; `EmployeeCreatedEvent`, `EmployeeUpdatedEvent`, `EmployeeTerminatedEvent` defined but never published |
| `@andikisha/health` | `BaseHealthController`, `DatabaseHealthIndicator`, `RedisHealthIndicator`, `MemoryHealthIndicator`, `GrpcHealthIndicator`, `RabbitMQHealthIndicator` |
| `@andikisha/grpc` | Placeholder; generated code written here by `scripts/generate-protos.sh` |
| `@andikisha/config` | Placeholder for future config expansion |

### ✅ Infrastructure

| Resource | Details |
|---|---|
| `docker/docker-compose.yml` | PostgreSQL 15, RabbitMQ 3.12, Redis 7, MinIO — all with healthchecks and named volumes |
| `k8s-deployment-example.yaml` | Deployments (2–3 replicas), Services, HPA (3–10 pods @ 70% CPU) for all 4 services |
| `proto/auth.proto` | 6 RPCs: Register, Login, RefreshToken, ValidateToken, Logout, GetUserById |
| `proto/employee.proto` | 17 RPCs: full CRUD for Employee, Department, Position, EmergencyContact, BankAccount (560 lines) |
| `scripts/create-service.sh` | Scaffolds a new NestJS microservice with correct workspace structure |
| `scripts/generate-protos.sh` | Regenerates TypeScript/JS from .proto files into `libs/grpc/src/generated/` |

---

## 5. What Is Missing

### 🔴 Critical — Core Product Value (Not Built)

**Payroll Service** *(port 3003 / gRPC 5003)*
- PAYE calculation (Kenyan tax bands: 0–24K @ 10%, 24K–32.3K @ 25%, above @ 30%)
- NSSF Tier I + Tier II contributions (employee + employer)
- NHIF/SHA monthly deductions
- Housing Levy (1.5% employee + 1.5% employer, effective March 2023)
- Gross → Net payslip calculation
- PDF payslip generation → MinIO
- M-PESA B2C bulk disbursement
- Bank EFT/ACH file generation
- Still to create: `proto/payroll.proto`, Prisma schema (PayrollRun, PayrollItem, Deduction, Allowance, Payslip)
- Path alias `@andikisha/payroll-service` already declared in `tsconfig.base.json`

**Compliance Service** *(port 3004 / gRPC 5004)*
- KRA iTax P9 annual form generation per employee
- KRA iTax P10 monthly returns
- NSSF monthly contribution schedules
- NHIF/SHA monthly schedules
- HELB loan deduction tracking
- WHT (Withholding Tax) reports
- Statutory deadline calendar + alert triggers via RabbitMQ
- Path alias `@andikisha/compliance-service` already declared in `tsconfig.base.json`

### 🟠 High — Required for MVP (Not Built)

**Leave Management Service**
- Leave types: annual, sick, maternity (90 days), paternity (14 days), compassionate
- Request → manager approval workflow (using Employee hierarchy)
- Leave balance accrual and carryover rules
- Kenya public holidays calendar (configurable)
- Integration point: unpaid leave → payroll deduction

**Document Service**
- MinIO S3 client integration (upload, download, presigned URLs)
- The `Document` model and `fileUrl` field in Employee schema are already built
- Required for: employment contracts, national ID copies, payslips, certificates

**Attendance Service**
- Manual check-in/check-out (API-based)
- Biometric device integration hook (future)
- Overtime tracking (1.5× / 2× rates for Kenya)
- Late arrival / early departure rules
- Integration point: attendance-based deductions → payroll

### 🟡 Medium — Important (Not Built)

**Notifications**
- Africa's Talking SMS: env vars exist (`AFRICAS_TALKING_API_KEY`), service not built
- SendGrid email: env vars exist (`SENDGRID_API_KEY`), service not built
- Use cases: payslip delivery, leave approval/rejection, password reset, onboarding welcome

**RabbitMQ Event Publishing**
- `EmployeeCreatedEvent`, `EmployeeUpdatedEvent`, `EmployeeTerminatedEvent` are fully defined in `@andikisha/rabbitmq`
- Zero services currently publish any event; no consumers exist
- RabbitMQ is running in Docker but carrying no traffic

**Security Fixes (3 bugs — fix immediately)**
- `hash.service.ts:32` — `Math.random()` → `crypto.randomBytes()`
- `auth.guard.ts:72` — cache key `jwt:<prefix>` → `jwt:<sha256(token)>`
- `api-gateway/main.ts:79` — Swagger unconditionally mounted → add `NODE_ENV !== 'production'` guard

**Test Suite**
- 2 scaffold spec files exist; ~5% coverage
- Needed first: `AuthGuard`, `AuthService`, `HashService`, `EmployeeService.createEmployee`
- The JWT cache collision bug would be caught immediately by AuthGuard unit tests

**CI/CD Pipeline**
- No `.github/workflows/` directory
- `pnpm audit` not run automatically
- Prisma migrations accidentally gitignored (must fix before first production deployment)

**Frontend**
- `andikisha-frontend/` directory is completely empty
- No framework selected
- Required views: HR dashboard, employee list, payroll management, self-service portal

---

## 6. Technical Strengths

| Strength | Details |
|---|---|
| Local JWT validation | Eliminates gRPC call per auth check; 93% latency reduction (15ms → <1ms) |
| Prisma transactions | All critical paths atomic: register, login, refresh, logout, createEmployee |
| Multi-tenancy | Tenant-scoped composite unique constraints on all models; cache keys include `tenantId` |
| Composite indexes | 15+ on Employee, 4+ on User; 70–90% query speedup on filtered lookups |
| Connection pooling | 50 connections (5× default), `statement_timeout = 30s` configured |
| Cache-aside pattern | `CacheService.getOrSet()`; 5-min TTL; 90% reduction in repeated lookups |
| Health probes | Separate `/health/live` and `/health/ready`; memory thresholds; K8s-compatible |
| Prometheus metrics | 6 custom metrics + Node.js defaults; histogram buckets correctly defined |
| Winston logging | JSON in prod, pretty in dev; 10MB file rotation; separate error logs |
| Joi env validation | All required vars validated at startup; fail-fast before accepting traffic |
| gRPC keepalive | 30s ping, 10s timeout, 4MB message limits; prevents silent connection drops |
| RBAC system | Roles + Permissions with seeded system roles; `hasRole()` / `hasPermission()` helpers |
| Soft deletes | Employees → TERMINATED (never hard deleted); full history preserved |
| Repository pattern | Clean data access layer with optional `tx` param throughout for composability |
| .gitignore discipline | 529 lines; payroll exports, biometrics, KRA credentials, API keys all excluded |

---

## 7. Technical Risks

| Risk | Severity | Location | Impact |
|---|---|---|---|
| `Math.random()` for security tokens | 🔴 Critical | `hash.service.ts:32` | Refresh tokens are predictable |
| JWT cache collision (prefix key) | 🔴 Critical | `auth.guard.ts:72` | Tokens sharing first 32 chars collide in cache |
| Swagger exposed unconditionally | 🔴 Critical | `main.ts:79` | Full API surface visible in production |
| ~5% test coverage | 🔴 Critical | All services | Bugs in production, no regression safety net |
| RabbitMQ carries zero traffic | 🟠 High | All services | No async decoupling; Payroll notifications will have no channel |
| Shared `DATABASE_URL` | 🟠 High | All service `.env` | One service's heavy load can starve another's connection pool |
| Prisma migrations gitignored | 🟠 High | `services/*/prisma/migrations/` | No reproducible schema history; prod deployment risky |
| Weak password policy (8 chars only) | 🟠 High | `auth.service.ts:421` | Payroll/HR system needs stronger passwords |
| No brute force protection on auth | 🟠 High | `app.module.ts` | `/auth/login` only rate-limited at global level (100 req/60s) |
| Session IP/UA always `null` | 🟠 High | `auth.service.ts:406` | Session hijacking undetectable |
| `JWT_SECRET` optional in validation | 🟡 Medium | `env.validation.ts:52` | Gateway starts without it; all auth silently fails |
| No audit trail | 🟡 Medium | All schemas | Kenya Data Protection Act 2019 requires who-changed-what |
| No CI/CD | 🟡 Medium | Root | Manual deployments; no automated quality gate |
| Frontend empty | 🟡 Medium | `andikisha-frontend/` | No user interface at all |
| Financial types use `double` semantics | 🟡 Medium | `employee.proto` | Payroll calculations need `Decimal`/`string` not float |

---

## 8. Hidden Dependencies & Assumptions

1. **JWT_SECRET must be identical** in API Gateway and Auth Service. Local JWT validation in the Gateway only works if both share the same secret. No startup check enforces this.

2. **Proto generated files are gitignored**: `libs/grpc/src/generated/` must be regenerated via `pnpm proto:generate` after every clone. This step is missing from the README onboarding guide.

3. **Prisma clients are gitignored**: `pnpm prisma:generate` must be run in each service before `pnpm build`. Again, not documented in README.

4. **Each service needs its own `.env`**: The shared `validationSchema` marks `JWT_SECRET` as optional — the Auth Service actually requires it; the Employee Service doesn't need it. The shared schema is a compromise that fits neither perfectly.

5. **`@@unique([userId])` is cross-tenant**: A user cannot be linked to employees in more than one tenant. This design assumption would break a "multi-employer" or "contractor" scenario.

6. **RabbitMQ credentials hardcoded in `docker-compose.yml`**: `admin:admin`. Fine for local dev, but there's no `.env` override pattern shown for production RabbitMQ credentials.

7. **MinIO paths are stored but nothing resolves them**: The `Document.fileUrl` field stores a MinIO object key. No service currently writes to or reads from MinIO.

8. **Health Aggregator assumes fixed ports**: It polls `localhost:{port}/health`. If any service port changes, the aggregator breaks with no alerting.

9. **gRPC proto path is relative to compiled output**: `join(__dirname, '../../../proto/employee.proto')`. If the compiled output directory changes, all gRPC services will fail to start.

---

## 9. Summary Scorecard

| Dimension | Score | Status |
|---|---|---|
| Infrastructure foundation | 97/100 | ✅ Excellent |
| Authentication & RBAC | 90/100 | ✅ Complete (2 security bugs) |
| Employee management | 88/100 | ✅ Complete (no document upload) |
| Performance | 95/100 | ✅ Excellent |
| Observability (health, metrics, logs) | 85/100 | ✅ Good |
| Security posture | 62/100 | ⚠️ 3 critical bugs, weak password policy |
| Test coverage | 5/100 | ❌ Critical gap |
| Payroll engine | 0/100 | ❌ Not built |
| Compliance (KRA/NSSF/NHIF) | 0/100 | ❌ Not built |
| Leave management | 0/100 | ❌ Not built |
| Attendance | 0/100 | ❌ Not built |
| Notifications (SMS/email) | 0/100 | ❌ Not built |
| Frontend | 0/100 | ❌ Empty directory |
| CI/CD | 0/100 | ❌ No pipeline |
| **Overall** | **~55/100** | Strong foundation; core product features unbuilt |

---

## 10. Recommended Build Order

### Phase 1 — Security & Stability *(1–2 days)*
*Must complete before any production traffic.*

1. `hash.service.ts:32` — Replace `Math.random()` with `crypto.randomBytes()`
2. `auth.guard.ts:72` — Cache key: `jwt:<sha256(token)>` not `jwt:<prefix>`
3. `main.ts:79` — Gate Swagger: `if (process.env.NODE_ENV !== 'production')`
4. `auth.service.ts:421` — Password: min 12 chars, require uppercase + digit + special
5. `app.module.ts` — Add stricter Throttler tier for `/auth/login` and `/auth/register`
6. `services/*/prisma/migrations/` — Remove from `.gitignore`; commit migration history

### Phase 2 — Test Foundation *(1 week)*
*Safety net before building new features.*

1. Unit tests: `AuthGuard` (5 scenarios including cache collision)
2. Unit tests: `AuthService.register/login/refresh/logout`
3. Unit tests: `HashService` + `JwtService`
4. Unit tests: `EmployeeService.createEmployee` (all validation branches)
5. E2E: Full auth cycle (register → login → refresh → logout)
6. CI: GitHub Actions — lint + test + coverage gate (70% minimum)

### Phase 3 — Payroll Service *(2–3 weeks)*
*This is the core product differentiator.*

1. Design `proto/payroll.proto` (PayrollRun, ProcessPayroll, GeneratePayslip, GetPayslip RPCs)
2. Create payroll-service with `scripts/create-service.sh payroll-service 3003 5003`
3. Prisma schema: PayrollRun, PayrollItem, SalaryComponent, StatutoryDeduction, Payslip
4. Implement Kenya-specific statutory calculations:
   - PAYE tax bands (2024 rates)
   - NSSF Tier I (KES 2,160 max) + Tier II (6% of pensionable pay)
   - NHIF/SHA (graduated scale)
   - Housing Levy (1.5% employer + 1.5% employee)
5. Wire `POST /payroll/runs` in API Gateway
6. PDF payslip generation → MinIO (triggers Document service)
7. Publish `PayrollProcessedEvent` via RabbitMQ

### Phase 4 — Compliance Service *(1–2 weeks)*

1. KRA iTax P9 annual form (per employee, per tax year)
2. KRA iTax P10 monthly PAYE returns
3. NSSF/NHIF monthly contribution schedules (CSV/Excel export)
4. HELB deduction tracking
5. Statutory deadline calendar with RabbitMQ alert events

### Phase 5 — Leave, Attendance, Notifications *(2–3 weeks)*

1. Leave service: types, request workflow, balance accrual, Kenya public holidays
2. Attendance: manual check-in/out, overtime calculation
3. Wire RabbitMQ: publish `EmployeeCreatedEvent` from Employee Service
4. Africa's Talking SMS: payslip delivery, leave notifications
5. SendGrid email: welcome emails, payslip delivery, password reset

### Phase 6 — Frontend *(ongoing, start after Phase 3)*

1. Framework: Next.js 14 (App Router) recommended for SSR + API routes
2. HR Dashboard: employee list, department tree, payroll summary
3. Payroll Management: run payroll, view payslips, approve disbursements
4. Employee Self-Service: view payslips, apply for leave, update profile
5. Admin: tenant configuration, user management, compliance reports

---

## 11. Critical Files Reference

| File | Why It Matters |
|---|---|
| `services/api-gateway/src/common/guards/auth.guard.ts` | JWT cache collision bug (line 72) |
| `services/auth-service/src/shared/hash.service.ts` | `Math.random()` bug (line 32) |
| `services/api-gateway/src/main.ts` | Swagger production exposure (line 79) |
| `services/auth-service/src/modules/auth/auth.service.ts` | All auth transactions; password validation |
| `services/employee-service/src/modules/employee/employee.service.ts` | `createEmployee` transaction |
| `services/employee-service/src/modules/employee/employee.controller.ts` | 30+ gRPC method handlers |
| `services/auth-service/prisma/schema.prisma` | Auth data model (6 tables) |
| `services/employee-service/prisma/schema.prisma` | Employee data model (8 models, 7 enums, 15+ indexes) |
| `libs/common/src/cache/cache.service.ts` | Cache-aside pattern used everywhere |
| `libs/common/src/config/env.validation.ts` | Joi schema — `JWT_SECRET` marked optional (bug) |
| `libs/database/src/prisma.service.ts` | Connection pool, slow query detection, health check |
| `libs/rabbitmq/src/events/employee.events.ts` | Events defined but never published |
| `proto/employee.proto` | 17 RPCs, 560 lines — source of truth for employee API |
| `proto/auth.proto` | 6 RPCs — source of truth for auth API |
| `tsconfig.base.json` | Path aliases — payroll + compliance aliases already declared |
| `docker/docker-compose.yml` | Local infrastructure; all 4 backing services |
| `k8s-deployment-example.yaml` | Production K8s manifests with HPA |
| `scripts/create-service.sh` | Use this to scaffold payroll-service and compliance-service |

---

*Analysis generated: 2026-03-03*
*Reviewed every .ts file in services/, libs/, proto/, docker/, docs/ and root config files.*
