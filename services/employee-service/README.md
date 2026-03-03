# Employee Service

gRPC-based employee management microservice for AndikishaHR.

## Features

- **Employee CRUD** - Create, read, update, delete employees
- **Multi-Tenant** - Complete tenant isolation
- **Event Publishing** - Publishes employee events to RabbitMQ
- **gRPC API** - High-performance inter-service communication

## Tech Stack

- NestJS v11
- gRPC (@grpc/grpc-js)
- Prisma ORM (when implemented)
- PostgreSQL
- RabbitMQ

## Setup

### Option A: Docker Compose (Recommended)

The easiest way to run the Employee Service with its own database.

#### 1. Start with Docker Compose

```bash
cd services/employee-service

# Start Employee Service + PostgreSQL
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This will:
- Start PostgreSQL on port **5434** (employee_service_db)
- Run database migrations automatically (when schema exists)
- Start Employee Service on gRPC port **5001**

#### 2. Access the Service

- **gRPC Server**: `localhost:5001`
- **Database**: `localhost:5434` (postgres/postgres)

### Option B: Local Development

Run the service locally without Docker.

#### 1. Environment Variables

The `.env` file already exists with:

```bash
# Database (local development)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/employee_service_db"

# Or use Docker Compose database
# DATABASE_URL="postgresql://postgres:postgres@localhost:5434/employee_service_db"

# RabbitMQ
RABBITMQ_URL="amqp://admin:admin@localhost:5672"

# Service Ports
PORT=3001
GRPC_PORT=5001

# Environment
NODE_ENV=development
```

#### 2. Create Database (if not using Docker Compose)

```bash
docker exec -it andikisha-postgres psql -U postgres -c "CREATE DATABASE employee_service_db;"
```

#### 3. Install Dependencies

```bash
pnpm install
```

#### 4. Start Service

```bash
# Development mode with hot reload
pnpm start:dev

# Production mode
pnpm build
pnpm start:prod
```

The service will start on port **5001** (gRPC).

---

## Quick Start Summary

**Docker Compose (Fastest)**:
```bash
cd services/employee-service
docker-compose up -d
# Service ready at localhost:5001 (gRPC)
```

**Local Development**:
```bash
cd services/employee-service
pnpm install
pnpm start:dev
# Service ready at localhost:5001 (gRPC)
```

## Project Structure

```
employee-service/
├── src/
│   ├── app.controller.ts     # Basic controller
│   ├── app.service.ts        # Basic service
│   ├── app.module.ts         # Root module
│   └── main.ts               # Bootstrap
├── prisma/                   # Database schema (to be added)
├── docker-compose.yml        # Service + Database
├── Dockerfile                # Production build
├── .env                      # Environment variables
└── package.json
```

## Database Ports

To avoid port conflicts, each service uses a different PostgreSQL port:

- **Auth Service**: `localhost:5433`
- **Employee Service**: `localhost:5434`
- **Future Services**: `5435`, `5436`, etc.

## Multi-Tenancy

All database queries will be filtered by `tenantId` to ensure complete data isolation between tenants (to be implemented with Prisma schema).

## Next Steps

1. **Implement Prisma Schema** - Define employee model
2. **Implement gRPC Service** - Create employee.proto and service
3. **Add CRUD Operations** - Create, read, update, delete employees
4. **Event Publishing** - Publish employee events to RabbitMQ
5. **Integration with Auth** - Validate JWT tokens from Auth Service

## Troubleshooting

### "Cannot connect to database"
- Ensure Docker services are running: `docker-compose up -d`
- Check DATABASE_URL in `.env`

### "Port 5001 already in use"
- Change `GRPC_PORT` in `.env`
- Or kill the process using the port

## License

UNLICENSED - Proprietary
