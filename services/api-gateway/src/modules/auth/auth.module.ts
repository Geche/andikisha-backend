import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { authGrpcOptions } from '../../config/grpc.config';

@Module({
  imports: [ClientsModule.register([authGrpcOptions])],
  controllers: [AuthController],
})
export class AuthModule {}
