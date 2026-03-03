import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@andikisha/database';
import { Prisma, Employee, EmploymentStatus } from '@prisma/client';

@Injectable()
export class EmployeeRepository {
  private readonly logger = new Logger(EmployeeRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new employee
   */
  async create(data: Prisma.EmployeeCreateInput): Promise<Employee> {
    this.logger.log(`Creating employee: ${data.email}`);
    return this.prisma.employee.create({
      data,
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
  }

  /**
   * Find employee by ID
   */
  async findById(id: string, tenantId: string): Promise<Employee | null> {
    return this.prisma.employee.findFirst({
      where: {
        id,
        tenantId,
      },
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
  }

  /**
   * Find employee by employee number
   */
  async findByEmployeeNumber(
    employeeNumber: string,
    tenantId: string,
  ): Promise<Employee | null> {
    return this.prisma.employee.findFirst({
      where: {
        employeeNumber,
        tenantId,
      },
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
  }

  /**
   * Find employee by email
   */
  async findByEmail(email: string, tenantId: string): Promise<Employee | null> {
    return this.prisma.employee.findFirst({
      where: {
        email,
        tenantId,
      },
    });
  }

  /**
   * Find employee by user ID
   */
  async findByUserId(userId: string, tenantId: string): Promise<Employee | null> {
    return this.prisma.employee.findFirst({
      where: {
        userId,
        tenantId,
      },
      include: {
        department: true,
        position: true,
        emergencyContacts: true,
        bankAccounts: true,
      },
    });
  }

  /**
   * Update employee
   */
  async update(
    id: string,
    tenantId: string,
    data: Prisma.EmployeeUpdateInput,
  ): Promise<Employee> {
    this.logger.log(`Updating employee: ${id}`);
    return this.prisma.employee.update({
      where: {
        id,
        tenantId,
      },
      data,
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
  }

  /**
   * Soft delete employee (set status to TERMINATED)
   */
  async delete(
    id: string,
    tenantId: string,
    terminationReason: string,
    terminationDate: Date,
  ): Promise<Employee> {
    this.logger.log(`Terminating employee: ${id}`);
    return this.prisma.employee.update({
      where: {
        id,
        tenantId,
      },
      data: {
        employmentStatus: EmploymentStatus.TERMINATED,
        terminationReason,
        terminationDate,
      },
    });
  }

  /**
   * List employees with pagination and filters
   */
  async findMany(params: {
    tenantId: string;
    skip?: number;
    take?: number;
    where?: Prisma.EmployeeWhereInput;
    orderBy?: Prisma.EmployeeOrderByWithRelationInput;
  }): Promise<{ employees: Employee[]; total: number }> {
    const { tenantId, skip = 0, take = 10, where = {}, orderBy } = params;

    const whereClause: Prisma.EmployeeWhereInput = {
      ...where,
      tenantId,
    };

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where: whereClause,
        skip,
        take,
        orderBy,
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          position: {
            select: {
              id: true,
              title: true,
              code: true,
            },
          },
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeNumber: true,
            },
          },
        },
      }),
      this.prisma.employee.count({ where: whereClause }),
    ]);

    return { employees, total };
  }

  /**
   * Count employees in a department
   */
  async countByDepartment(departmentId: string, tenantId: string): Promise<number> {
    return this.prisma.employee.count({
      where: {
        departmentId,
        tenantId,
        employmentStatus: {
          in: [EmploymentStatus.ACTIVE, EmploymentStatus.PROBATION],
        },
      },
    });
  }

  /**
   * Count employees in a position
   */
  async countByPosition(positionId: string, tenantId: string): Promise<number> {
    return this.prisma.employee.count({
      where: {
        positionId,
        tenantId,
        employmentStatus: {
          in: [EmploymentStatus.ACTIVE, EmploymentStatus.PROBATION],
        },
      },
    });
  }

  /**
   * Check if employee number exists
   */
  async employeeNumberExists(
    employeeNumber: string,
    tenantId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.employee.count({
      where: {
        employeeNumber,
        tenantId,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
    return count > 0;
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.employee.count({
      where: {
        email,
        tenantId,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
    return count > 0;
  }
}
