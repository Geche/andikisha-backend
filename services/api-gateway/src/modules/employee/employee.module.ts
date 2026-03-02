import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { EmployeeController } from './employee.controller';
import { employeeGrpcOptions } from '../../config/grpc.config';

@Module({
  imports: [ClientsModule.register([employeeGrpcOptions])],
  controllers: [EmployeeController],
})
export class EmployeeModule {}
