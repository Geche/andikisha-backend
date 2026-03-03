import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const isDevelopment = process.env.NODE_ENV !== "production";

    super({
      // Optimize connection pool for high-throughput applications
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Configure logging based on environment
      log: isDevelopment
        ? [
            { level: "query", emit: "event" },
            { level: "error", emit: "stdout" },
            { level: "warn", emit: "stdout" },
          ]
        : [
            { level: "error", emit: "stdout" },
            { level: "warn", emit: "stdout" },
          ],
      // Performance optimizations
      errorFormat: isDevelopment ? "pretty" : "minimal",
    });

    // Log slow queries in development (>100ms)
    if (isDevelopment) {
      this.$on("query" as never, (e: any) => {
        if (e.duration > 100) {
          this.logger.warn(`Slow query detected (${e.duration}ms): ${e.query}`);
        }
      });
    }
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log("Successfully connected to database");

      // Set connection pool parameters
      await this.$executeRawUnsafe(`
                SET statement_timeout = '30s';
                SET idle_in_transaction_session_timeout = '60s';
            `);
    } catch (error) {
      this.logger.error("Failed to connect to database", error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Disconnected from database");
  }

  async enableShutdownHooks(app: any) {
    this.$on("beforeExit", async () => {
      await app.close();
    });
  }

  /**
   * Health check method for database connectivity
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
