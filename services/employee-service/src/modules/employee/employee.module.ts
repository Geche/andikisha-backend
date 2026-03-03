import { Module } from '@nestjs/common';
import { PrismaModule } from '@andikisha/database';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { EmployeeRepository } from './employee.repository';
import { DepartmentService } from '../department/department.service';
import { PositionService } from '../position/position.service';
import { EmergencyContactService } from '../contact/emergency-contact.service';
import { BankAccountService } from '../bank/bank-account.service';

@Module({
  imports: [PrismaModule],
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
    EmployeeRepository,
    DepartmentService,
    PositionService,
    EmergencyContactService,
    BankAccountService,
  ],
  exports: [EmployeeService, EmployeeRepository],
})
export class EmployeeModule {}
