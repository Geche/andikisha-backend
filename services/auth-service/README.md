# Auth Service

gRPC-based authentication and authorization microservice for AndikishaHR.

## Features

- **User Registration** - Create new users with role assignment
- **JWT Authentication** - Login with access and refresh tokens
- **Token Refresh** - Refresh expired access tokens
- **Token Validation** - Validate tokens for API Gateway
- **Session Management** - Track active user sessions
- **Role-Based Access Control (RBAC)** - Granular permissions system
- **Multi-Tenant** - Complete tenant isolation
- **Password Security** - bcrypt hashing with configurable salt rounds

## Tech Stack

- NestJS v11
- gRPC (@grpc/grpc-js)
- Prisma ORM
- PostgreSQL
- JWT (@nestjs/jwt)
- bcrypt

## Database Schema

### Models

- **User** - User accounts with multi-tenant support
- **Role** - User roles (system and tenant-specific)
- **Permission** - Granular permissions (resource:action)
- **UserRole** - User-Role mapping
- **RolePermission** - Role-Permission mapping
- **Session** - Active user sessions
- **RefreshToken** - JWT refresh tokens

### System Roles

Created automatically on startup:

- `admin` - Full system access
- `hr_manager` - HR management access
- `employee` - Basic employee access
- `payroll_officer` - Payroll management access

## Setup

### Option A: Docker Compose (Recommended)

The easiest way to run the Auth Service with its own database.

#### 1. Start with Docker Compose

```bash
cd services/auth-service

# Start Auth Service + PostgreSQL
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This will:
- Start PostgreSQL on port **5433** (auth_service_db)
- Run database migrations automatically
- Start Auth Service on gRPC port **5002**

#### 2. Access the Service

- **gRPC Server**: `localhost:5002`
- **Database**: `localhost:5433` (postgres/postgres)

### Option B: Local Development

Run the service locally without Docker.

#### 1. Environment Variables

Create `.env` file in `/services/auth-service/`:

```bash
# Database (local development)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auth_service_db"

# Or use Docker Compose database
# DATABASE_URL="postgresql://postgres:postgres@localhost:5433/auth_service_db"

# Service Ports
PORT=3002
GRPC_PORT=5002

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_ACCESS_TOKEN_EXPIRATION="15m"
JWT_REFRESH_TOKEN_EXPIRATION="7d"
```

#### 2. Start Infrastructure (Optional)

If you need RabbitMQ, Redis, or MinIO, start the main infrastructure:

```bash
cd /path/to/andikisha-backend
pnpm docker:up
```

#### 3. Create Database (if not using Docker Compose)

Create the auth service database:

```bash
docker exec -it andikisha-postgres psql -U postgres -c "CREATE DATABASE auth_service_db;"
```

Or connect via psql:

```bash
docker exec -it andikisha-postgres psql -U postgres
CREATE DATABASE auth_service_db;
\q
```

#### 4. Run Migrations

Generate Prisma client and run migrations:

```bash
cd services/auth-service

# Generate Prisma Client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Or create migration manually
npx prisma migrate dev --name init
```

#### 5. Start Service

```bash
# Development mode with hot reload
pnpm dev

# Or
pnpm start:dev

# Production mode
pnpm build
pnpm start:prod
```

The gRPC server will start on port **5002** (configurable via `GRPC_PORT`).

---

## Quick Start Summary

**Docker Compose (Fastest)**:
```bash
cd services/auth-service
docker-compose up -d
# Service ready at localhost:5002 (gRPC)
```

**Local Development**:
```bash
cd services/auth-service
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
# Service ready at localhost:5002 (gRPC)
```

## gRPC Service Definition

### Register

Register a new user with optional role assignment.

**Request:**
```protobuf
{
  tenant_id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role_names?: string[]; // Default: ["employee"]
}
```

**Response:**
```protobuf
{
  user_id: string;
  email: string;
  message: string;
}
```

### Login

Authenticate user and receive JWT tokens.

**Request:**
```protobuf
{
  tenant_id: string;
  email: string;
  password: string;
}
```

**Response:**
```protobuf
{
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  user: {
    id: string;
    tenant_id: string;
    email: string;
    // ... other user fields
    roles: string[];
  }
}
```

### RefreshToken

Refresh an expired access token.

**Request:**
```protobuf
{
  refresh_token: string;
}
```

**Response:**
```protobuf
{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
```

### ValidateToken

Validate an access token (used by API Gateway).

**Request:**
```protobuf
{
  access_token: string;
}
```

**Response:**
```protobuf
{
  is_valid: boolean;
  user_id?: string;
  tenant_id?: string;
  roles?: string[];
  permissions?: string[]; // ["resource:action", ...]
}
```

### Logout

Revoke user tokens and destroy sessions.

**Request:**
```protobuf
{
  access_token: string;
}
```

**Response:**
```protobuf
{
  success: boolean;
  message: string;
}
```

### GetUserById

Retrieve user information by ID.

**Request:**
```protobuf
{
  user_id: string;
  tenant_id: string;
}
```

**Response:**
```protobuf
{
  user: {
    id: string;
    tenant_id: string;
    email: string;
    // ... other user fields
    roles: string[];
  }
}
```

## Testing

### Prerequisites

- Postman with gRPC support, OR
- BloomRPC (gRPC GUI client), OR
- grpcurl (command-line tool)

### Using Postman

1. Import the proto file: `/proto/auth.proto`
2. Connect to `localhost:5002`
3. Test each method

### Example: Register User

```json
{
  "tenant_id": "tenant-123",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+254712345678",
  "role_names": ["employee"]
}
```

### Example: Login

```json
{
  "tenant_id": "tenant-123",
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

### Using grpcurl

Install grpcurl:
```bash
brew install grpcurl  # macOS
```

Test Register:
```bash
grpcurl -plaintext -d '{
  "tenant_id": "tenant-123",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "role_names": ["employee"]
}' \
-import-path ../../../proto \
-proto auth.proto \
localhost:5002 \
auth.AuthService/Register
```

## Development

### Run in Watch Mode

```bash
pnpm dev
```

### Prisma Studio (Database GUI)

```bash
pnpm prisma:studio
```

### Database Reset

```bash
npx prisma migrate reset
```

### Generate Prisma Client After Schema Changes

```bash
pnpm prisma:generate
```

## Project Structure

```
auth-service/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── modules/
│   │   ├── auth/              # Auth module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── user/              # User module
│   │   │   ├── user.service.ts
│   │   │   ├── user.repository.ts
│   │   │   └── user.module.ts
│   │   └── role/              # Role module
│   │       ├── role.service.ts
│   │       └── role.module.ts
│   ├── shared/                # Shared services
│   │   ├── hash.service.ts    # Password hashing
│   │   └── jwt.service.ts     # JWT generation/validation
│   ├── app.module.ts          # Root module
│   └── main.ts                # gRPC server bootstrap
├── .env                       # Environment variables
├── package.json
└── README.md
```

## Multi-Tenancy

All database queries are filtered by `tenantId` to ensure complete data isolation between tenants. The tenant ID must be provided in all requests.

## Security

- Passwords are hashed with bcrypt (10 salt rounds)
- JWT tokens use HS256 algorithm
- Refresh tokens can be revoked
- Sessions track IP address and user agent
- Password minimum length: 8 characters

## Next Steps

After Auth Service is running:

1. **API Gateway Integration** - Connect API Gateway to Auth Service via gRPC
2. **Implement Auth Guards** - Create JWT validation guards in API Gateway
3. **Swagger Documentation** - Add API documentation for HTTP endpoints
4. **Permission Seeding** - Create default permissions for resources
5. **Email Verification** - Implement email verification flow
6. **Password Reset** - Implement forgot password functionality
7. **2FA (Optional)** - Add two-factor authentication

## Troubleshooting

### "Cannot connect to database"
- Ensure Docker services are running: `pnpm docker:up`
- Check DATABASE_URL in `.env`
- Verify database exists: `docker exec -it andikisha-postgres psql -U postgres -l`

### "Prisma Client not generated"
- Run: `pnpm prisma:generate`

### "Port 5002 already in use"
- Change `GRPC_PORT` in `.env`
- Or kill the process using the port

### "JWT_SECRET not defined"
- Set `JWT_SECRET` in `.env` file

## License

UNLICENSED - Proprietary
