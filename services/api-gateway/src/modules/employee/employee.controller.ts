import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
  OnModuleInit,
  Req,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { Public } from '../../common/guards/auth.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ListEmployeesDto } from './dto/list-employees.dto';

interface EmployeeServiceClient {
  createEmployee(data: any): any;
  getEmployeeById(data: any): any;
  getEmployeeByNumber(data: any): any;
  updateEmployee(data: any): any;
  deleteEmployee(data: any): any;
  listEmployees(data: any): any;
}

@ApiTags('employees')
@ApiBearerAuth('JWT-auth')
@Controller('employees')
export class EmployeeController implements OnModuleInit {
  private employeeService: EmployeeServiceClient;

  constructor(@Inject('EMPLOYEE_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.employeeService = this.client.getService<EmployeeServiceClient>('EmployeeService');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiResponse({
    status: 201,
    description: 'Employee created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'Conflict - employee number or email already exists' })
  async createEmployee(@Req() req: any, @Body() createEmployeeDto: CreateEmployeeDto) {
    const tenantId = req.tenantId;
    const result = await firstValueFrom(
      this.employeeService.createEmployee({
        ...createEmployeeDto,
        tenant_id: tenantId,
      }),
    );
    return result;
  }

  @Get()
  @ApiOperation({ summary: 'List employees with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'List of employees',
  })
  async listEmployees(@Req() req: any, @Query() query: ListEmployeesDto) {
    const tenantId = req.tenantId;
    const result = await firstValueFrom(
      this.employeeService.listEmployees({
        tenant_id: tenantId,
        ...query,
      }),
    );
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiParam({ name: 'id', description: 'Employee ID', example: 'emp-uuid' })
  @ApiResponse({
    status: 200,
    description: 'Employee found',
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getEmployeeById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantId;
    const result = await firstValueFrom(
      this.employeeService.getEmployeeById({
        id,
        tenant_id: tenantId,
      }),
    );
    return result;
  }

  @Get('number/:employeeNumber')
  @ApiOperation({ summary: 'Get employee by employee number' })
  @ApiParam({ name: 'employeeNumber', description: 'Employee number', example: 'EMP001' })
  @ApiResponse({
    status: 200,
    description: 'Employee found',
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getEmployeeByNumber(@Req() req: any, @Param('employeeNumber') employeeNumber: string) {
    const tenantId = req.tenantId;
    const result = await firstValueFrom(
      this.employeeService.getEmployeeByNumber({
        employee_number: employeeNumber,
        tenant_id: tenantId,
      }),
    );
    return result;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update employee' })
  @ApiParam({ name: 'id', description: 'Employee ID', example: 'emp-uuid' })
  @ApiResponse({
    status: 200,
    description: 'Employee updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async updateEmployee(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    const tenantId = req.tenantId;
    const result = await firstValueFrom(
      this.employeeService.updateEmployee({
        id,
        tenant_id: tenantId,
        ...updateEmployeeDto,
      }),
    );
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Terminate employee' })
  @ApiParam({ name: 'id', description: 'Employee ID', example: 'emp-uuid' })
  @ApiQuery({
    name: 'termination_reason',
    required: false,
    description: 'Reason for termination',
  })
  @ApiQuery({
    name: 'termination_date',
    required: false,
    description: 'Termination date (ISO 8601)',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee terminated successfully',
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async deleteEmployee(
    @Req() req: any,
    @Param('id') id: string,
    @Query('termination_reason') terminationReason?: string,
    @Query('termination_date') terminationDate?: string,
  ) {
    const tenantId = req.tenantId;
    const result = await firstValueFrom(
      this.employeeService.deleteEmployee({
        id,
        tenant_id: tenantId,
        termination_reason: terminationReason,
        termination_date: terminationDate,
      }),
    );
    return result;
  }
}
