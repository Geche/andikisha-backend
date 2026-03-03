# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **API Gateway Integration** - Complete HTTP gateway with Auth Service integration:
  - **Security Middleware**:
    - Helmet for security headers (XSS protection, clickjacking prevention, etc.)
    - CORS configuration with configurable origins and credentials support
    - Compression middleware for response optimization
    - Cookie parser for cookie handling
    - Global validation pipe with DTO transformation
  - **Authentication & Authorization**:
    - `AuthGuard` - JWT token validation via Auth Service gRPC
    - `@Public()` decorator for public routes (no auth required)
    - Token extraction from Authorization header (Bearer scheme)
    - User context attachment to requests (id, tenantId, roles, permissions)
  - **Multi-Tenancy**:
    - `TenantMiddleware` - Extracts tenant from X-Tenant-ID header, subdomain, or path
    - Tenant validation for all protected routes
    - Tenant context attachment to requests
  - **Exception Handling**:
    - `HttpExceptionFilter` - Global exception handler
    - gRPC error to HTTP status code mapping
    - Standardized error response format
    - Development vs production error details
  - **Interceptors**:
    - `LoggingInterceptor` - Request/response logging with tenant and user tracking
    - `TimeoutInterceptor` - Request timeout handling (default 30s)
  - **Rate Limiting**:
    - ThrottlerGuard for DDoS protection
    - Configurable rate limits (TTL and max requests)
  - **gRPC Client Configuration**:
    - Auth Service client (localhost:5002)
    - Employee Service client (localhost:5001)
    - Keepalive settings for connection health
  - **Auth HTTP Routes** (`/api/auth`):
    - POST `/auth/register` - User registration (public)
    - POST `/auth/login` - User login with JWT tokens (public)
    - POST `/auth/refresh` - Token refresh (public)
    - POST `/auth/logout` - User logout with token revocation (protected)
  - **Swagger/OpenAPI Documentation**:
    - Interactive API documentation at `/api/docs`
    - Bearer authentication support
    - Tenant ID header documentation
    - Request/response schemas with validation
    - Organized by tags (auth, employees, payroll, compliance)
  - **Health Endpoints**:
    - GET `/` - Simple health check
    - GET `/health` - Detailed health with service URLs

- **Auth Service** (gRPC Microservice) - Complete authentication and authorization implementation:
  - **Prisma Database Schema**:
    - User model with multi-tenant support, email verification, and activity tracking
    - Role model with system roles (admin, hr_manager, employee, payroll_officer) and tenant-specific roles
    - Permission model for granular access control (resource:action pattern)
    - UserRole and RolePermission junction tables for many-to-many relationships
    - Session model for active session tracking
    - RefreshToken model for JWT refresh token management
  - **gRPC Service Definition** (`proto/auth.proto`):
    - Register - User registration with role assignment
    - Login - User authentication with JWT tokens
    - RefreshToken - Access token refresh mechanism
    - ValidateToken - Token validation for API Gateway
    - Logout - Token revocation
    - GetUserById - User retrieval with roles
  - **Core Services**:
    - `HashService` - bcrypt password hashing with salt rounds
    - `JwtService` - JWT token generation and validation (access + refresh tokens)
    - `UserRepository` - Prisma queries for user operations
    - `UserService` - User CRUD, password validation, role management
    - `RoleService` - Role and permission management, system role initialization
    - `AuthService` - Authentication business logic (register, login, refresh, validate, logout)
    - `AuthController` - gRPC controller implementing proto service interface
  - **Features**:
    - Multi-tenant isolation (all queries filtered by tenantId)
    - Role-based access control (RBAC) with permissions
    - JWT access and refresh token flow
    - Password strength validation
    - Automatic system role creation on startup (admin, hr_manager, employee, payroll_officer)
    - Session tracking with IP address and user agent
    - Refresh token revocation
    - User activity tracking (last login timestamp)
  - **Configuration**:
    - Environment-based JWT secret and expiration times
    - Configurable database URL (PostgreSQL)
    - gRPC server on port 5002
    - NestJS module architecture with dependency injection

- **Employee Service** (gRPC Microservice) - Complete employee management implementation:
  - **Prisma Database Schema** (`services/employee-service/prisma/schema.prisma`):
    - **Employee Model** - Comprehensive employee data with multi-tenant support:
      - Personal information (name, email, phone, DOB, gender, marital status, nationality)
      - Identification (employee number, national ID, passport, tax ID, NSSF, NHIF)
      - Address information (multi-line addresses with city, state, postal code, country)
      - Employment details (department, position, employment type, status, hire date, probation)
      - Reporting structure (manager relationships with self-referencing)
      - Work schedule and location tracking
    - **Department Model** - Hierarchical department structure:
      - Self-referencing parent-child relationships for org hierarchy
      - Department manager assignment
      - Active/inactive status tracking
      - Unique department codes per tenant
    - **Position Model** - Job position/title management:
      - Position title, code, description, and level
      - Department association
      - Salary range (min/max salary fields)
      - Active/inactive status tracking
    - **EmergencyContact Model** - Employee emergency contacts:
      - Full contact details (name, relationship, phone, email, address)
      - Primary contact designation
      - Multiple contacts per employee support
    - **BankAccount Model** - Employee banking information:
      - Bank details (name, branch, account number, SWIFT code)
      - Multi-currency support (default KES)
      - Primary account designation
      - Secure account information storage
    - **EmploymentHistory Model** - Employment change tracking:
      - Track promotions, demotions, transfers, department changes
      - Change reason and effective date
      - Audit trail for employment lifecycle
    - **Document Model** - Employee document management:
      - Document type classification (contract, ID, certificates, etc.)
      - MinIO file storage integration
      - File metadata (size, mime type, upload timestamp)
  - **gRPC Service Definition** (`proto/employee.proto`):
    - **Employee Operations**:
      - CreateEmployee - Create new employee with full validation
      - GetEmployeeById - Retrieve employee by UUID
      - GetEmployeeByNumber - Retrieve by employee number
      - UpdateEmployee - Update employee details
      - DeleteEmployee - Soft delete (terminate) employee
      - ListEmployees - Paginated list with filters (department, position, status, search)
    - **Department Operations**:
      - CreateDepartment - Create department with parent relationships
      - GetDepartmentById - Retrieve department details
      - UpdateDepartment - Update department information
      - DeleteDepartment - Delete department (with validation)
      - ListDepartments - Paginated department list with hierarchy
    - **Position Operations**:
      - CreatePosition - Create job position
      - GetPositionById - Retrieve position details
      - UpdatePosition - Update position information
      - DeletePosition - Delete position (with validation)
      - ListPositions - Paginated position list
    - **Emergency Contact Operations**:
      - AddEmergencyContact - Add contact for employee
      - UpdateEmergencyContact - Update contact details
      - DeleteEmergencyContact - Remove emergency contact
    - **Bank Account Operations**:
      - AddBankAccount - Add bank account for employee
      - UpdateBankAccount - Update account details
      - DeleteBankAccount - Remove bank account
      - SetPrimaryBankAccount - Designate primary account
  - **Core Services** (`services/employee-service/src/modules/`):
    - **EmployeeRepository** - Prisma data access layer:
      - CRUD operations with tenant isolation
      - Employee number and email uniqueness validation
      - Complex queries with department, position, manager relations
      - Employee count aggregations by department/position
      - Pagination and filtering support
    - **EmployeeService** - Employee business logic:
      - Employee creation with validation (unique number, email)
      - Manager validation and relationship management
      - Department and position assignment
      - Soft delete with termination tracking
      - Search by name, email, or employee number
      - Employment status management
    - **DepartmentService** - Department management:
      - Hierarchical department creation
      - Parent-child relationship validation
      - Circular reference prevention
      - Employee count tracking per department
      - Cascade validation (prevent delete if has employees/children)
    - **PositionService** - Position management:
      - Position creation with department association
      - Salary range validation
      - Employee count tracking per position
      - Cascade validation (prevent delete if has employees)
    - **EmergencyContactService** - Emergency contact management:
      - Primary contact designation (auto-unset others)
      - Tenant isolation validation
      - Employee association validation
    - **BankAccountService** - Bank account management:
      - Primary account designation (auto-unset others)
      - Multi-currency support
      - Tenant isolation validation
    - **EmployeeController** - gRPC controller:
      - Implements all proto service methods
      - Data mapping between Prisma models and proto messages
      - Error handling with gRPC status codes
      - Comprehensive logging
  - **Features**:
    - Multi-tenant isolation (all queries filtered by tenantId)
    - Soft delete for employees (termination with reason and date)
    - Hierarchical department structure (unlimited depth)
    - Employee search (name, email, number)
    - Pagination and sorting for all list operations
    - Referential integrity (manager, department, position validations)
    - Primary designation for contacts and bank accounts
    - Employment history tracking (planned)
    - Document management integration (planned)
  - **Configuration**:
    - Dedicated PostgreSQL database (port 5434)
    - Docker Compose configuration per service
    - gRPC server on port 5001
    - Multi-stage Docker build for production
    - Environment-based database configuration
  - **Enums**:
    - Gender (MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY)
    - MaritalStatus (SINGLE, MARRIED, DIVORCED, WIDOWED, SEPARATED)
    - EmploymentType (FULL_TIME, PART_TIME, CONTRACT, TEMPORARY, INTERN, CONSULTANT)
    - EmploymentStatus (ACTIVE, PROBATION, ON_LEAVE, SUSPENDED, TERMINATED, RESIGNED, RETIRED)
    - WorkSchedule (FULL_TIME, PART_TIME, FLEXIBLE, REMOTE, HYBRID, SHIFT)
    - EmploymentChangeType (HIRE, PROMOTION, TRANSFER, etc.)
    - DocumentType (CONTRACT, ID_COPY, CERTIFICATE, etc.)

- **Employee HTTP Routes in API Gateway** (`/api/employees`):
  - POST `/employees` - Create new employee (protected)
  - GET `/employees` - List employees with pagination and filters (protected)
  - GET `/employees/:id` - Get employee by ID (protected)
  - GET `/employees/number/:employeeNumber` - Get by employee number (protected)
  - PUT `/employees/:id` - Update employee (protected)
  - DELETE `/employees/:id` - Terminate employee (protected)
  - **DTOs with Swagger Documentation**:
    - CreateEmployeeDto - Full validation for employee creation
    - UpdateEmployeeDto - Partial update with optional fields
    - ListEmployeesDto - Query parameters for filtering and pagination
  - **Integration**:
    - gRPC client connection to Employee Service (port 5001)
    - Automatic tenant injection from request context
    - JWT authentication required (via AuthGuard)
    - Comprehensive error handling and mapping

- **Docker Configuration**:
  - **Auth Service Docker Compose** (`services/auth-service/docker-compose.yml`):
    - PostgreSQL 15-Alpine on port 5433
    - Auto-migration on startup
    - Volume persistence
    - Health checks
    - Andikisha network integration
  - **Employee Service Docker Compose** (`services/employee-service/docker-compose.yml`):
    - PostgreSQL 15-Alpine on port 5434
    - Auto-migration on startup
    - Volume persistence
    - Health checks
    - Andikisha network integration
  - **Multi-stage Dockerfiles** for both services:
    - Stage 1: Dependencies installation
    - Stage 2: Build with TypeScript compilation
    - Stage 3: Production runtime with node user
    - Optimized image sizes
  - **.dockerignore** files for both services:
    - Exclude node_modules, .env, .git
    - Minimize image size and build time

- **PROJECT_PLAN.md** - Comprehensive product and project plan:
  - Detailed breakdown of all 8 microservices (API Gateway, Auth, Employee, Payroll, Leave, Attendance, Compliance, Document)
  - Complete database schemas for each service with Prisma models
  - Module structure for each service
  - Required libraries and dependencies per service
  - RabbitMQ event definitions (published/subscribed events)
  - 16-week development roadmap divided into 8 phases
  - External integration points (M-PESA, KRA iTax, Africa's Talking, SendGrid)
  - Inter-service communication patterns
  - Technology stack summary

- **Documentation improvements**:
  - Comprehensive README.md with getting started guide
  - .env.example with all configuration options
  - CHANGELOG.md following Keep a Changelog format

### Planned

- Payroll processing and calculations
- Compliance reporting with KRA iTax integration
- Leave management system
- Attendance tracking with check-in/check-out
- Document management with MinIO storage
- M-PESA payment integration for payroll
- SMS notifications via Africa's Talking
- Email notifications via SendGrid
- API documentation with Swagger/OpenAPI
- Database schemas and migrations (Prisma)
- gRPC service definitions and implementations

## [1.0.0] - 2024-12-22

### Added

#### Project Infrastructure

- Initial project setup with pnpm workspace monorepo
- NestJS v11 microservices architecture
- TypeScript 5.7 configuration with strict mode
- ESLint and Prettier for code quality
- Jest testing framework with coverage support
- Git repository initialization

#### Services

- **API Gateway** (NestJS v11) - HTTP entry point with template structure
  - Basic Express server configuration
  - Helmet for security headers
  - Compression middleware
  - Cookie parser integration
  - Swagger integration ready
  - Rate limiting with @nestjs/throttler
  - JWT authentication module
  - Placeholder routes for: auth, employees, payroll, compliance, leave, attendance, documents, reports
- **Employee Service** - Employee management service template
  - Basic NestJS application structure
  - Ready for gRPC and REST endpoints

#### Shared Libraries

- **@andikisha/common** (v1.0.0) - Core shared utilities
  - **Decorators**:
    - `@CurrentTenant()` - Extract current tenant from request context
    - `@TenantId()` - Extract tenant ID from request
  - **DTOs**:
    - `PaginationDto` - Validated pagination with page, limit, sortBy, sortOrder
  - **Interfaces**:
    - `PaginationParams` - Pagination parameters interface
    - `PaginatedResponse<T>` - Generic paginated response structure
    - `Tenant` - Tenant entity interface
    - `TenantSettings` - Currency, timezone, language, date format, fiscal year
  - **Enums**:
    - `TenantStatus` - ACTIVE, SUSPENDED, TRIAL, CANCELLED, INACTIVE
    - `SubscriptionPlan` - STARTER (1-10), GROWTH (11-50), PROFESSIONAL (51-200), ENTERPRISE (200+), UNLIMITED
  - Placeholder structure for: entities, exceptions, filters, guards, interceptors, pipes, utils

- **@andikisha/database** (v1.0.0) - Prisma ORM integration
  - `PrismaService` - Database service with lifecycle management
  - `PrismaModule` - Global database module
  - Connection and disconnection handling
  - Query logging (query, info, warn, error)
  - Graceful shutdown hooks

- **@andikisha/rabbitmq** (v1.0.0) - Event bus and messaging
  - `RabbitMQService` - Message broker service
  - `RabbitMQModule` - Dynamic module with configurable queues
  - **Event Classes**:
    - `EmployeeCreatedEvent` - Employee creation event
    - `EmployeeUpdatedEvent` - Employee update event
    - `EmployeeTerminatedEvent` - Employee termination event
  - Event payload interface with metadata (eventId, timestamp, tenantId, correlationId, retryCount)
  - Emit and send methods for async/sync messaging

- **@andikisha/grpc** (v1.0.0) - gRPC utilities (scaffolding)
  - Basic structure for gRPC client/server implementations
  - Ready for proto-generated code

- **@andikisha/config** (v1.0.0) - Configuration management (scaffolding)
  - Basic configuration module structure

#### Docker Infrastructure

- **Docker Compose** configuration with full stack:
  - **PostgreSQL 15-Alpine**:
    - Port 5432 with postgres/postgres credentials
    - Volume persistence (postgres_data)
    - Health checks enabled
    - Multi-database support ready
  - **RabbitMQ 3.12 with Management UI**:
    - AMQP port 5672, Management UI port 15672
    - Credentials: admin/admin
    - Default vhost configured
    - Volume persistence (rabbitmq_data)
    - Health checks enabled
  - **Redis 7-Alpine**:
    - Port 6379 with password: redis123
    - AOF persistence enabled
    - Volume persistence (redis_data)
    - Health checks enabled
  - **MinIO (S3-Compatible Storage)**:
    - API port 9000, Console port 9001
    - Credentials: minioadmin/minioadmin
    - Volume persistence (minio_data)
    - Health checks enabled
  - Bridge network (andikisha-network) for service communication

#### Build & Development

- **NPM Scripts**:
  - `dev:gateway`, `dev:employee`, `dev:auth`, `dev:payroll`, `dev:compliance` - Individual service development
  - `dev:all` - Concurrent execution of all services
  - `build` - Build all services in workspace
  - `test` - Run all tests
  - `lint` - Lint all TypeScript code
  - `format` - Format code with Prettier
  - `docker:up`, `docker:down`, `docker:logs` - Docker Compose management
  - `proto:generate` - Generate TypeScript from proto files

#### Configuration

- TypeScript configuration:
  - `tsconfig.base.json` - Base configuration with path aliases
  - `useDefineForClassFields: false` for decorator compatibility
  - Decorator metadata emission enabled
  - Target ES2021 with CommonJS modules
- Path aliases for all services and libraries:
  - `@andikisha/common`, `@andikisha/database`, `@andikisha/rabbitmq`, `@andikisha/grpc`
  - Service paths for gateway, auth, employee, payroll, compliance
- Environment configuration:
  - `.env` files for service-specific configuration
  - Database URLs, RabbitMQ connections, Redis configuration
  - Service ports (PORT, GRPC_PORT)
  - Development/production environment support

#### Documentation

- **CLAUDE.md** - Comprehensive developer guide for Claude Code:
  - Project overview and tech stack
  - Repository structure documentation
  - Common development commands
  - Architecture notes (microservices, communication patterns)
  - Shared libraries documentation
  - Multi-tenancy explanation
  - Data sensitivity warnings
  - Integration notes for African services
- **README.md** - Project documentation with:
  - Feature overview and roadmap
  - Architecture diagrams
  - Getting started guide
  - Development workflow
  - Multi-tenancy documentation
  - Contributing guidelines
- **CHANGELOG.md** - This file, following Keep a Changelog format

#### Developer Experience

- Hot reload enabled for all services
- Concurrent service execution support
- Proto generation scripts ready
- Comprehensive build system
- Test coverage reporting
- Code formatting and linting
- TypeScript strict mode enabled

### Infrastructure

- Docker network configuration for seamless service-to-service communication
- Health check mechanisms for all infrastructure services
- Volume management for persistent data storage
- Environment variable-based configuration system
- Multi-database architecture support (one database per service)

### Security

- Helmet middleware for security headers
- CORS configuration ready
- JWT authentication scaffolding
- Multi-tenant data isolation architecture
- Environment variable protection (.gitignore configured)
- Sensitive data handling guidelines documented

## [0.1.0] - 2024-12-21

### Added

- Initial repository creation
- Basic project structure skeleton
- Git initialization
- First commit

---

## Version History Guidelines

### Versioning Strategy

We use [Semantic Versioning](https://semver.org/):

- **MAJOR** version (X.0.0) - Incompatible API changes, breaking changes
- **MINOR** version (0.X.0) - New features, backwards-compatible additions
- **PATCH** version (0.0.X) - Backwards-compatible bug fixes

### Changelog Maintenance

When making changes to the codebase:

1. **Add entries under `[Unreleased]`** in the appropriate category:
   - **Added** - New features, new files, new functionality
   - **Changed** - Changes to existing functionality
   - **Deprecated** - Soon-to-be removed features (still available but discouraged)
   - **Removed** - Removed features or files
   - **Fixed** - Bug fixes
   - **Security** - Security-related changes, vulnerability patches

2. **Before each release**:
   - Move items from `[Unreleased]` to a new version section
   - Add the release date in YYYY-MM-DD format
   - Create a new empty `[Unreleased]` section
   - Update version number according to semantic versioning

3. **Writing good changelog entries**:
   - Write for humans, not machines
   - Be specific about what changed and why
   - Group related changes together
   - Reference issue/PR numbers when applicable
   - Use past tense ("Added" not "Add")

### Example Entry Format

```markdown
## [1.1.0] - 2024-12-25

### Added

- Employee CRUD API endpoints with validation (#42)
- JWT-based authentication with refresh tokens (#45)
- Tenant-aware database queries with automatic filtering

### Changed

- Updated Prisma schema to include employee relationships (#43)
- Improved error handling in API Gateway with custom exceptions

### Fixed

- Fixed pagination offset calculation in PaginationDto (#44)
- Resolved memory leak in RabbitMQ connection handling
```

### Release Process

1. Update CHANGELOG.md (move Unreleased to version section)
2. Update package.json version numbers
3. Commit changes: `git commit -m "chore: release v1.1.0"`
4. Create git tag: `git tag -a v1.1.0 -m "Release v1.1.0"`
5. Push changes and tags: `git push && git push --tags`

---

**Remember**: Always update this changelog when making significant changes to the project. Keep it up-to-date to maintain a clear project history!
