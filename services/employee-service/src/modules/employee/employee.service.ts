import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '@andikisha/database';
import { EmployeeRepository } from './employee.repository';
import {
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  ListEmployeesRequest,
  DeleteEmployeeRequest,
  Employee as EmployeeProto,
  EmploymentStatus as ProtoEmploymentStatus,
} from '../../proto/employee.pb';
import { Employee, Prisma, EmploymentStatus } from '@prisma/client';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create a new employee
   *
   * USES TRANSACTION: Ensures all validations and employee creation are atomic.
   * If any validation fails or creation fails, the entire operation is rolled back.
   */
  async createEmployee(request: CreateEmployeeRequest): Promise<Employee> {
    this.logger.log(`Creating employee: ${request.email}`);

    try {
      // Use transaction for all database operations
      return await this.prisma.$transaction(async (tx) => {
        // Validate employee number uniqueness
        const existingByNumber = await tx.employee.findFirst({
          where: {
            employeeNumber: request.employee_number!,
            tenantId: request.tenant_id!,
          },
        });

        if (existingByNumber) {
          throw new RpcException({
            code: 6, // ALREADY_EXISTS
            message: `Employee number ${request.employee_number} already exists`,
          });
        }

        // Validate email uniqueness
        const existingByEmail = await tx.employee.findFirst({
          where: {
            email: request.email!,
            tenantId: request.tenant_id!,
          },
        });

        if (existingByEmail) {
          throw new RpcException({
            code: 6, // ALREADY_EXISTS
            message: `Email ${request.email} already exists`,
          });
        }

        // Validate manager exists if provided
        if (request.manager_id) {
          const manager = await tx.employee.findFirst({
            where: {
              id: request.manager_id,
              tenantId: request.tenant_id!,
            },
          });

          if (!manager) {
            throw new RpcException({
              code: 5, // NOT_FOUND
              message: `Manager with ID ${request.manager_id} not found`,
            });
          }
        }

        // Validate department exists if provided
        if (request.department_id) {
          const department = await tx.department.findFirst({
            where: {
              id: request.department_id,
              tenantId: request.tenant_id!,
            },
          });

          if (!department) {
            throw new RpcException({
              code: 5, // NOT_FOUND
              message: `Department with ID ${request.department_id} not found`,
            });
          }
        }

        // Validate position exists if provided
        if (request.position_id) {
          const position = await tx.position.findFirst({
            where: {
              id: request.position_id,
              tenantId: request.tenant_id!,
            },
          });

          if (!position) {
            throw new RpcException({
              code: 5, // NOT_FOUND
              message: `Position with ID ${request.position_id} not found`,
            });
          }
        }

        // Create employee data
        const employeeData: Prisma.EmployeeCreateInput = {
          tenantId: request.tenant_id!,
          userId: request.user_id || undefined,
          employeeNumber: request.employee_number!,
          firstName: request.first_name!,
          middleName: request.middle_name || undefined,
          lastName: request.last_name!,
          email: request.email!,
          phoneNumber: request.phone_number!,
          alternatePhone: request.alternate_phone || undefined,
          dateOfBirth: new Date(request.date_of_birth!),
          gender: request.gender as any,
          maritalStatus: request.marital_status as any,
          nationality: request.nationality!,
          nationalId: request.national_id || undefined,
          passportNumber: request.passport_number || undefined,
          taxId: request.tax_id || undefined,
          nssfNumber: request.nssf_number || undefined,
          nhifNumber: request.nhif_number || undefined,
          addressLine1: request.address_line1!,
          addressLine2: request.address_line2 || undefined,
          city: request.city!,
          state: request.state || undefined,
          postalCode: request.postal_code || undefined,
          country: request.country || 'Kenya',
          employmentType: request.employment_type as any,
          hireDate: new Date(request.hire_date!),
          probationEndDate: request.probation_end_date
            ? new Date(request.probation_end_date)
            : undefined,
          workSchedule: request.work_schedule as any,
          workLocation: request.work_location || undefined,
          employmentStatus: EmploymentStatus.PROBATION,
        };

        // Connect department if provided
        if (request.department_id) {
          employeeData.department = {
            connect: { id: request.department_id },
          };
        }

        // Connect position if provided
        if (request.position_id) {
          employeeData.position = {
            connect: { id: request.position_id },
          };
        }

        // Connect manager if provided
        if (request.manager_id) {
          employeeData.manager = {
            connect: { id: request.manager_id },
          };
        }

        // Create employee within transaction
        return await tx.employee.create({
          data: employeeData,
          include: {
            department: true,
            position: true,
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeNumber: true,
                email: true,
              },
            },
            emergencyContacts: true,
            bankAccounts: true,
          },
        });
      });
    } catch (error) {
      // If it's already an RpcException, rethrow it
      if (error instanceof RpcException) {
        throw error;
      }

      // Otherwise, log and throw internal error
      this.logger.error(`Failed to create employee: ${error.message}`, error.stack);
      throw new RpcException({
        code: 13, // INTERNAL
        message: 'Failed to create employee',
      });
    }
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: string, tenantId: string): Promise<Employee> {
    const employee = await this.employeeRepository.findById(id, tenantId);

    if (!employee) {
      throw new RpcException({
        code: 5, // NOT_FOUND
        message: `Employee with ID ${id} not found`,
      });
    }

    return employee;
  }

  /**
   * Get employee by employee number
   */
  async getEmployeeByNumber(employeeNumber: string, tenantId: string): Promise<Employee> {
    const employee = await this.employeeRepository.findByEmployeeNumber(
      employeeNumber,
      tenantId,
    );

    if (!employee) {
      throw new RpcException({
        code: 5, // NOT_FOUND
        message: `Employee with number ${employeeNumber} not found`,
      });
    }

    return employee;
  }

  /**
   * Update employee
   */
  async updateEmployee(request: UpdateEmployeeRequest): Promise<Employee> {
    this.logger.log(`Updating employee: ${request.id}`);

    // Check if employee exists
    const existingEmployee = await this.employeeRepository.findById(
      request.id!,
      request.tenant_id!,
    );

    if (!existingEmployee) {
      throw new RpcException({
        code: 5, // NOT_FOUND
        message: `Employee with ID ${request.id} not found`,
      });
    }

    // Validate email uniqueness if being updated
    if (request.email) {
      const emailExists = await this.employeeRepository.emailExists(
        request.email,
        request.tenant_id!,
        request.id!,
      );

      if (emailExists) {
        throw new RpcException({
          code: 6, // ALREADY_EXISTS
          message: `Email ${request.email} already exists`,
        });
      }
    }

    // Validate manager exists if being updated
    if (request.manager_id) {
      const manager = await this.employeeRepository.findById(
        request.manager_id,
        request.tenant_id!,
      );
      if (!manager) {
        throw new RpcException({
          code: 5, // NOT_FOUND
          message: `Manager with ID ${request.manager_id} not found`,
        });
      }
    }

    try {
      const updateData: Prisma.EmployeeUpdateInput = {};

      // Update personal information
      if (request.first_name) updateData.firstName = request.first_name;
      if (request.middle_name !== undefined) updateData.middleName = request.middle_name;
      if (request.last_name) updateData.lastName = request.last_name;
      if (request.email) updateData.email = request.email;
      if (request.phone_number) updateData.phoneNumber = request.phone_number;
      if (request.alternate_phone !== undefined)
        updateData.alternatePhone = request.alternate_phone;
      if (request.gender) updateData.gender = request.gender as any;
      if (request.marital_status) updateData.maritalStatus = request.marital_status as any;
      if (request.national_id !== undefined) updateData.nationalId = request.national_id;
      if (request.passport_number !== undefined)
        updateData.passportNumber = request.passport_number;
      if (request.tax_id !== undefined) updateData.taxId = request.tax_id;
      if (request.nssf_number !== undefined) updateData.nssfNumber = request.nssf_number;
      if (request.nhif_number !== undefined) updateData.nhifNumber = request.nhif_number;

      // Update address
      if (request.address_line1) updateData.addressLine1 = request.address_line1;
      if (request.address_line2 !== undefined)
        updateData.addressLine2 = request.address_line2;
      if (request.city) updateData.city = request.city;
      if (request.state !== undefined) updateData.state = request.state;
      if (request.postal_code !== undefined) updateData.postalCode = request.postal_code;
      if (request.country) updateData.country = request.country;

      // Update employment information
      if (request.employment_type) updateData.employmentType = request.employment_type as any;
      if (request.employment_status)
        updateData.employmentStatus = request.employment_status as any;
      if (request.confirmation_date)
        updateData.confirmationDate = new Date(request.confirmation_date);
      if (request.work_schedule) updateData.workSchedule = request.work_schedule as any;
      if (request.work_location !== undefined)
        updateData.workLocation = request.work_location;

      // Update department
      if (request.department_id) {
        updateData.department = {
          connect: { id: request.department_id },
        };
      }

      // Update position
      if (request.position_id) {
        updateData.position = {
          connect: { id: request.position_id },
        };
      }

      // Update manager
      if (request.manager_id) {
        updateData.manager = {
          connect: { id: request.manager_id },
        };
      }

      return await this.employeeRepository.update(
        request.id!,
        request.tenant_id!,
        updateData,
      );
    } catch (error) {
      this.logger.error(`Failed to update employee: ${error.message}`, error.stack);
      throw new RpcException({
        code: 13, // INTERNAL
        message: 'Failed to update employee',
      });
    }
  }

  /**
   * Delete (terminate) employee
   */
  async deleteEmployee(request: DeleteEmployeeRequest): Promise<void> {
    this.logger.log(`Terminating employee: ${request.id}`);

    // Check if employee exists
    const employee = await this.employeeRepository.findById(
      request.id!,
      request.tenant_id!,
    );

    if (!employee) {
      throw new RpcException({
        code: 5, // NOT_FOUND
        message: `Employee with ID ${request.id} not found`,
      });
    }

    const terminationDate = request.termination_date
      ? new Date(request.termination_date)
      : new Date();

    await this.employeeRepository.delete(
      request.id!,
      request.tenant_id!,
      request.termination_reason || 'No reason provided',
      terminationDate,
    );
  }

  /**
   * List employees with pagination and filters
   */
  async listEmployees(request: ListEmployeesRequest): Promise<{
    employees: Employee[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = request.page || 1;
    const limit = request.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.EmployeeWhereInput = {};

    if (request.department_id) {
      where.departmentId = request.department_id;
    }

    if (request.position_id) {
      where.positionId = request.position_id;
    }

    if (request.employment_status) {
      where.employmentStatus = request.employment_status as any;
    }

    // Search by name, email, or employee number
    if (request.search) {
      where.OR = [
        { firstName: { contains: request.search, mode: 'insensitive' } },
        { lastName: { contains: request.search, mode: 'insensitive' } },
        { email: { contains: request.search, mode: 'insensitive' } },
        { employeeNumber: { contains: request.search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause
    const orderBy: Prisma.EmployeeOrderByWithRelationInput = {};
    const sortBy = request.sort_by || 'createdAt';
    const sortOrder = (request.sort_order?.toLowerCase() || 'desc') as 'asc' | 'desc';
    orderBy[sortBy] = sortOrder;

    const { employees, total } = await this.employeeRepository.findMany({
      tenantId: request.tenant_id!,
      skip,
      take: limit,
      where,
      orderBy,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      employees,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
