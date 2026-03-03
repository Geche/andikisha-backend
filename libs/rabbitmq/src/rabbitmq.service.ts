import { Injectable, Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

export const RABBITMQ_CLIENT_TOKEN = "RABBITMQ_CLIENT";

export interface EventPayload<T = unknown> {
  eventId: string;
  eventType: string;
  timestamp: string;
  tenantId: string;
  source: string;
  version: string;
  data: T;
  metadata: {
    userId?: string;
    correlationId?: string;
    retryCount?: number;
  };
}

export interface EventMetadata {
  tenantId?: string;
  source?: string;
  userId?: string;
  correlationId?: string;
  retryCount?: number;
}

@Injectable()
export class RabbitMQService {
  constructor(
    @Inject(RABBITMQ_CLIENT_TOKEN) private readonly client: ClientProxy
  ) {}

  async emit<T>(
    eventType: string,
    data: T,
    metadata?: EventMetadata
  ): Promise<void> {
    const event: EventPayload<T> = {
      eventId: this.generateEventId(),
      eventType,
      timestamp: new Date().toISOString(),
      tenantId: metadata?.tenantId || "system",
      source: metadata?.source || "unknown",
      version: "1.0",
      data,
      metadata: {
        userId: metadata?.userId,
        correlationId: metadata?.correlationId || this.generateCorrelationId(),
        retryCount: metadata?.retryCount ?? 0,
      },
    };

    this.client.emit(eventType, event);
  }

  async send<TResult, TInput>(pattern: string, data: TInput): Promise<TResult> {
    return firstValueFrom(this.client.send<TResult>(pattern, data));
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
