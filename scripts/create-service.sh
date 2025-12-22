SERVICE_NAME=$1
HTTP_PORT=$2
GRPC_PORT=$3

if [ -z "$SERVICE_NAME" ] || [ -z "$HTTP_PORT" ] || [ -z "$GRPC_PORT" ]; then
  echo "Usage: ./scripts/create-service.sh service-name http-port grpc-port"
  echo "Example: ./scripts/create-service.sh employee-service 3001 5001"
  exit 1
fi

echo "🚀 Creating $SERVICE_NAME..."

# Navigate to services directory
cd services

# Create service using NestJS CLI
nest new $SERVICE_NAME --skip-git --package-manager pnpm

# Create Prisma directory
mkdir -p $SERVICE_NAME/prisma

# Create database name (replace hyphens with underscores)
DB_NAME=$(echo $SERVICE_NAME | sed 's/-/_/g')

# Create .env file
cat > $SERVICE_NAME/.env << EOF
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/${DB_NAME}_db"

# RabbitMQ
RABBITMQ_URL="amqp://admin:admin@localhost:5672"

# Redis
REDIS_URL="redis://localhost:6379"

# Service Ports
PORT=$HTTP_PORT
GRPC_PORT=$GRPC_PORT

# Environment
NODE_ENV=development
EOF

# Update package.json with workspace dependencies
cd $SERVICE_NAME

# Add common scripts
cat > temp_package.json << 'EOF'
{
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "start:prod": "node dist/main",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  }
}
EOF

# Merge with existing package.json (you'll need jq installed)
# or manually update after

cd ../..

echo ""
echo "✅ Service $SERVICE_NAME created successfully!"
echo ""
echo "📁 Location: services/$SERVICE_NAME"
echo "🌐 HTTP Port: $HTTP_PORT"
echo "🔌 gRPC Port: $GRPC_PORT"
echo "💾 Database: ${DB_NAME}_db"
echo ""
echo "Next steps:"
echo "  1. cd services/$SERVICE_NAME"
echo "  2. Update package.json to add workspace dependencies:"
echo "     - @andikisha/common"
echo "     - @andikisha/database"
echo "     - @andikisha/rabbitmq"
echo "     - @andikisha/grpc"
echo "  3. Create prisma/schema.prisma"
echo "  4. pnpm install"
echo "  5. pnpm db:generate"
echo "  6. pnpm db:migrate"
echo "  7. pnpm dev"
echo ""