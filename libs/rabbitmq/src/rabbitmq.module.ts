import { DynamicModule, Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { RabbitMQService, RABBITMQ_CLIENT_TOKEN } from "./rabbitmq.service";

export interface RabbitMQModuleOptions {
  name?: string;
  url: string;
  queue: string;
  queueOptions?: {
    durable?: boolean;
    arguments?: Record<string, any>;
  };
}

@Module({})
export class RabbitMQModule {
  static register(options: RabbitMQModuleOptions): DynamicModule {
    const clientName = options.name || RABBITMQ_CLIENT_TOKEN;

    return {
      module: RabbitMQModule,
      imports: [
        ClientsModule.register([
          {
            name: clientName,
            transport: Transport.RMQ,
            options: {
              urls: [options.url],
              queue: options.queue,
              queueOptions: {
                durable: true,
                ...options.queueOptions,
              },
            },
          },
        ]),
      ],
      providers: [RabbitMQService],
      exports: [ClientsModule, RabbitMQService],
    };
  }
}
