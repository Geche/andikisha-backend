import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { EmployeeService } from './employee.service';
import { DepartmentService } from '../department/department.service';
import { PositionService } from '../position/position.service';
import { EmergencyContactService } from '../contact/emergency-contact.service';
import { BankAccountService } from '../bank/bank-account.service';
import {
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  GetEmployeeByIdRequest,
  GetEmployeeByNumberRequest,
  DeleteEmployeeRequest,
  ListEmployeesRequest,
  EmployeeResponse,
  ListEmployeesResponse,
  DeleteEmployeeResponse,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  GetDepartmentByIdRequest,
  DeleteDepartmentRequest,
  ListDepartmentsRequest,
  DepartmentResponse,
  ListDepartmentsResponse,
  DeleteDepartmentResponse,
  CreatePositionRequest,
  UpdatePositionRequest,
  GetPositionByIdRequest,
  DeletePositionRequest,
  ListPositionsRequest,
  PositionResponse,
  ListPositionsResponse,
  DeletePositionResponse,
  AddEmergencyContactRequest,
  UpdateEmergencyContactRequest,
  DeleteEmergencyContactRequest,
  EmergencyContactResponse,
  DeleteEmergencyContactResponse,
  AddBankAccountRequest,
  UpdateBankAccountRequest,
  DeleteBankAccountRequest,
  SetPrimaryBankAccountRequest,
  BankAccountResponse,
  DeleteBankAccountResponse,
} from '../../proto/employee.pb';

@Controller()
export class EmployeeController {
  private readonly logger = new Logger(EmployeeController.name);

  constructor(
    private readonly employeeService: EmployeeService,
    private readonly departmentService: DepartmentService,
    private readonly positionService: PositionService,
    private readonly emergencyContactService: EmergencyContactService,
    private readonly bankAccountService: BankAccountService,
  ) {}

  // ============================================================================
  // EMPLOYEE OPERATIONS
  // ============================================================================

  @GrpcMethod('EmployeeService', 'CreateEmployee')
  async createEmployee(request: CreateEmployeeRequest): Promise<EmployeeResponse> {
    this.logger.log('gRPC CreateEmployee called');
    const employee = await this.employeeService.createEmployee(request);
    return { employee: this.mapEmployeeToProto(employee) };
  }

  @GrpcMethod('EmployeeService', 'GetEmployeeById')
  async getEmployeeById(request: GetEmployeeByIdRequest): Promise<EmployeeResponse> {
    this.logger.log('gRPC GetEmployeeById called');
    const employee = await this.employeeService.getEmployeeById(
      request.id!,
      request.tenant_id!,
    );
    return { employee: this.mapEmployeeToProto(employee) };
  }

  @GrpcMethod('EmployeeService', 'GetEmployeeByNumber')
  async getEmployeeByNumber(request: GetEmployeeByNumberRequest): Promise<EmployeeResponse> {
    this.logger.log('gRPC GetEmployeeByNumber called');
    const employee = await this.employeeService.getEmployeeByNumber(
      request.employee_number!,
      request.tenant_id!,
    );
    return { employee: this.mapEmployeeToProto(employee) };
  }

  @GrpcMethod('EmployeeService', 'UpdateEmployee')
  async updateEmployee(request: UpdateEmployeeRequest): Promise<EmployeeResponse> {
    this.logger.log('gRPC UpdateEmployee called');
    const employee = await this.employeeService.updateEmployee(request);
    return { employee: this.mapEmployeeToProto(employee) };
  }

  @GrpcMethod('EmployeeService', 'DeleteEmployee')
  async deleteEmployee(request: DeleteEmployeeRequest): Promise<DeleteEmployeeResponse> {
    this.logger.log('gRPC DeleteEmployee called');
    await this.employeeService.deleteEmployee(request);
    return {
      success: true,
      message: 'Employee terminated successfully',
    };
  }

  @GrpcMethod('EmployeeService', 'ListEmployees')
  async listEmployees(request: ListEmployeesRequest): Promise<ListEmployeesResponse> {
    this.logger.log('gRPC ListEmployees called');
    const result = await this.employeeService.listEmployees(request);

    return {
      employees: result.employees.map((emp) => this.mapEmployeeToProto(emp)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      total_pages: result.totalPages,
    };
  }

  // ============================================================================
  // DEPARTMENT OPERATIONS
  // ============================================================================

  @GrpcMethod('EmployeeService', 'CreateDepartment')
  async createDepartment(request: CreateDepartmentRequest): Promise<DepartmentResponse> {
    this.logger.log('gRPC CreateDepartment called');
    const department = await this.departmentService.createDepartment(request);
    return { department: this.mapDepartmentToProto(department) };
  }

  @GrpcMethod('EmployeeService', 'GetDepartmentById')
  async getDepartmentById(request: GetDepartmentByIdRequest): Promise<DepartmentResponse> {
    this.logger.log('gRPC GetDepartmentById called');
    const department = await this.departmentService.getDepartmentById(
      request.id!,
      request.tenant_id!,
    );
    return { department: this.mapDepartmentToProto(department) };
  }

  @GrpcMethod('EmployeeService', 'UpdateDepartment')
  async updateDepartment(request: UpdateDepartmentRequest): Promise<DepartmentResponse> {
    this.logger.log('gRPC UpdateDepartment called');
    const department = await this.departmentService.updateDepartment(request);
    return { department: this.mapDepartmentToProto(department) };
  }

  @GrpcMethod('EmployeeService', 'DeleteDepartment')
  async deleteDepartment(request: DeleteDepartmentRequest): Promise<DeleteDepartmentResponse> {
    this.logger.log('gRPC DeleteDepartment called');
    await this.departmentService.deleteDepartment(request.id!, request.tenant_id!);
    return {
      success: true,
      message: 'Department deleted successfully',
    };
  }

  @GrpcMethod('EmployeeService', 'ListDepartments')
  async listDepartments(request: ListDepartmentsRequest): Promise<ListDepartmentsResponse> {
    this.logger.log('gRPC ListDepartments called');
    const result = await this.departmentService.listDepartments(request);

    return {
      departments: result.departments.map((dept) => this.mapDepartmentToProto(dept)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      total_pages: result.totalPages,
    };
  }

  // ============================================================================
  // POSITION OPERATIONS
  // ============================================================================

  @GrpcMethod('EmployeeService', 'CreatePosition')
  async createPosition(request: CreatePositionRequest): Promise<PositionResponse> {
    this.logger.log('gRPC CreatePosition called');
    const position = await this.positionService.createPosition(request);
    return { position: this.mapPositionToProto(position) };
  }

  @GrpcMethod('EmployeeService', 'GetPositionById')
  async getPositionById(request: GetPositionByIdRequest): Promise<PositionResponse> {
    this.logger.log('gRPC GetPositionById called');
    const position = await this.positionService.getPositionById(
      request.id!,
      request.tenant_id!,
    );
    return { position: this.mapPositionToProto(position) };
  }

  @GrpcMethod('EmployeeService', 'UpdatePosition')
  async updatePosition(request: UpdatePositionRequest): Promise<PositionResponse> {
    this.logger.log('gRPC UpdatePosition called');
    const position = await this.positionService.updatePosition(request);
    return { position: this.mapPositionToProto(position) };
  }

  @GrpcMethod('EmployeeService', 'DeletePosition')
  async deletePosition(request: DeletePositionRequest): Promise<DeletePositionResponse> {
    this.logger.log('gRPC DeletePosition called');
    await this.positionService.deletePosition(request.id!, request.tenant_id!);
    return {
      success: true,
      message: 'Position deleted successfully',
    };
  }

  @GrpcMethod('EmployeeService', 'ListPositions')
  async listPositions(request: ListPositionsRequest): Promise<ListPositionsResponse> {
    this.logger.log('gRPC ListPositions called');
    const result = await this.positionService.listPositions(request);

    return {
      positions: result.positions.map((pos) => this.mapPositionToProto(pos)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      total_pages: result.totalPages,
    };
  }

  // ============================================================================
  // EMERGENCY CONTACT OPERATIONS
  // ============================================================================

  @GrpcMethod('EmployeeService', 'AddEmergencyContact')
  async addEmergencyContact(
    request: AddEmergencyContactRequest,
  ): Promise<EmergencyContactResponse> {
    this.logger.log('gRPC AddEmergencyContact called');
    const contact = await this.emergencyContactService.addEmergencyContact(request);
    return { emergency_contact: this.mapEmergencyContactToProto(contact) };
  }

  @GrpcMethod('EmployeeService', 'UpdateEmergencyContact')
  async updateEmergencyContact(
    request: UpdateEmergencyContactRequest,
  ): Promise<EmergencyContactResponse> {
    this.logger.log('gRPC UpdateEmergencyContact called');
    const contact = await this.emergencyContactService.updateEmergencyContact(request);
    return { emergency_contact: this.mapEmergencyContactToProto(contact) };
  }

  @GrpcMethod('EmployeeService', 'DeleteEmergencyContact')
  async deleteEmergencyContact(
    request: DeleteEmergencyContactRequest,
  ): Promise<DeleteEmergencyContactResponse> {
    this.logger.log('gRPC DeleteEmergencyContact called');
    await this.emergencyContactService.deleteEmergencyContact(
      request.id!,
      request.employee_id!,
      request.tenant_id!,
    );
    return {
      success: true,
      message: 'Emergency contact deleted successfully',
    };
  }

  // ============================================================================
  // BANK ACCOUNT OPERATIONS
  // ============================================================================

  @GrpcMethod('EmployeeService', 'AddBankAccount')
  async addBankAccount(request: AddBankAccountRequest): Promise<BankAccountResponse> {
    this.logger.log('gRPC AddBankAccount called');
    const account = await this.bankAccountService.addBankAccount(request);
    return { bank_account: this.mapBankAccountToProto(account) };
  }

  @GrpcMethod('EmployeeService', 'UpdateBankAccount')
  async updateBankAccount(request: UpdateBankAccountRequest): Promise<BankAccountResponse> {
    this.logger.log('gRPC UpdateBankAccount called');
    const account = await this.bankAccountService.updateBankAccount(request);
    return { bank_account: this.mapBankAccountToProto(account) };
  }

  @GrpcMethod('EmployeeService', 'DeleteBankAccount')
  async deleteBankAccount(
    request: DeleteBankAccountRequest,
  ): Promise<DeleteBankAccountResponse> {
    this.logger.log('gRPC DeleteBankAccount called');
    await this.bankAccountService.deleteBankAccount(
      request.id!,
      request.employee_id!,
      request.tenant_id!,
    );
    return {
      success: true,
      message: 'Bank account deleted successfully',
    };
  }

  @GrpcMethod('EmployeeService', 'SetPrimaryBankAccount')
  async setPrimaryBankAccount(
    request: SetPrimaryBankAccountRequest,
  ): Promise<BankAccountResponse> {
    this.logger.log('gRPC SetPrimaryBankAccount called');
    const account = await this.bankAccountService.setPrimaryBankAccount(request);
    return { bank_account: this.mapBankAccountToProto(account) };
  }

  // ============================================================================
  // MAPPING HELPERS
  // ============================================================================

  private mapEmployeeToProto(employee: any): any {
    return {
      id: employee.id,
      tenant_id: employee.tenantId,
      user_id: employee.userId || undefined,
      employee_number: employee.employeeNumber,
      first_name: employee.firstName,
      middle_name: employee.middleName || undefined,
      last_name: employee.lastName,
      email: employee.email,
      phone_number: employee.phoneNumber,
      alternate_phone: employee.alternatePhone || undefined,
      date_of_birth: employee.dateOfBirth?.toISOString(),
      gender: employee.gender,
      marital_status: employee.maritalStatus,
      nationality: employee.nationality,
      national_id: employee.nationalId || undefined,
      passport_number: employee.passportNumber || undefined,
      tax_id: employee.taxId || undefined,
      nssf_number: employee.nssfNumber || undefined,
      nhif_number: employee.nhifNumber || undefined,
      address_line1: employee.addressLine1,
      address_line2: employee.addressLine2 || undefined,
      city: employee.city,
      state: employee.state || undefined,
      postal_code: employee.postalCode || undefined,
      country: employee.country,
      department_id: employee.departmentId || undefined,
      position_id: employee.positionId || undefined,
      employment_type: employee.employmentType,
      employment_status: employee.employmentStatus,
      hire_date: employee.hireDate?.toISOString(),
      confirmation_date: employee.confirmationDate?.toISOString() || undefined,
      probation_end_date: employee.probationEndDate?.toISOString() || undefined,
      termination_date: employee.terminationDate?.toISOString() || undefined,
      termination_reason: employee.terminationReason || undefined,
      manager_id: employee.managerId || undefined,
      work_schedule: employee.workSchedule,
      work_location: employee.workLocation || undefined,
      department: employee.department ? this.mapDepartmentToProto(employee.department) : undefined,
      position: employee.position ? this.mapPositionToProto(employee.position) : undefined,
      manager: employee.manager
        ? {
            id: employee.manager.id,
            first_name: employee.manager.firstName,
            last_name: employee.manager.lastName,
            employee_number: employee.manager.employeeNumber,
            email: employee.manager.email,
          }
        : undefined,
      emergency_contacts: employee.emergencyContacts?.map((contact) =>
        this.mapEmergencyContactToProto(contact),
      ),
      bank_accounts: employee.bankAccounts?.map((account) =>
        this.mapBankAccountToProto(account),
      ),
      created_at: employee.createdAt?.toISOString(),
      updated_at: employee.updatedAt?.toISOString(),
    };
  }

  private mapDepartmentToProto(department: any): any {
    return {
      id: department.id,
      tenant_id: department.tenantId,
      name: department.name,
      code: department.code,
      description: department.description || undefined,
      manager_id: department.managerId || undefined,
      parent_id: department.parentId || undefined,
      is_active: department.isActive,
      created_at: department.createdAt?.toISOString(),
      updated_at: department.updatedAt?.toISOString(),
      children: department.children?.map((child) => ({
        id: child.id,
        name: child.name,
        code: child.code,
      })),
      employee_count: department.employee_count || 0,
    };
  }

  private mapPositionToProto(position: any): any {
    return {
      id: position.id,
      tenant_id: position.tenantId,
      title: position.title,
      code: position.code,
      description: position.description || undefined,
      department_id: position.departmentId || undefined,
      level: position.level,
      min_salary: position.minSalary ? Number(position.minSalary) : undefined,
      max_salary: position.maxSalary ? Number(position.maxSalary) : undefined,
      is_active: position.isActive,
      created_at: position.createdAt?.toISOString(),
      updated_at: position.updatedAt?.toISOString(),
      department: position.department
        ? {
            id: position.department.id,
            name: position.department.name,
            code: position.department.code,
          }
        : undefined,
      employee_count: position.employee_count || 0,
    };
  }

  private mapEmergencyContactToProto(contact: any): any {
    return {
      id: contact.id,
      employee_id: contact.employeeId,
      full_name: contact.fullName,
      relationship: contact.relationship,
      phone_number: contact.phoneNumber,
      alternate_phone: contact.alternatePhone || undefined,
      email: contact.email || undefined,
      address: contact.address || undefined,
      is_primary: contact.isPrimary,
      created_at: contact.createdAt?.toISOString(),
      updated_at: contact.updatedAt?.toISOString(),
    };
  }

  private mapBankAccountToProto(account: any): any {
    return {
      id: account.id,
      employee_id: account.employeeId,
      bank_name: account.bankName,
      branch_name: account.branchName || undefined,
      account_number: account.accountNumber,
      account_name: account.accountName,
      swift_code: account.swiftCode || undefined,
      currency: account.currency,
      is_primary: account.isPrimary,
      created_at: account.createdAt?.toISOString(),
      updated_at: account.updatedAt?.toISOString(),
    };
  }
}
