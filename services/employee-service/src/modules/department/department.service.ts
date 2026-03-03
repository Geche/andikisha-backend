import { Injectable, Logger, Inject } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '@andikisha/database';
import {
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  ListDepartmentsRequest,
} from '../../proto/employee.pb';
import { Department, Prisma } from '@prisma/client';
import { EmployeeRepository } from '../employee/employee.repository';

@Injectable()
export class DepartmentService {
  private readonly logger = new Logger(DepartmentService.name);
  private readonly CACHE_TTL = 600; // 10 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly employeeRepository: EmployeeRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Create a new department
   */
  async createDepartment(request: CreateDepartmentRequest): Promise<Department> {
    this.logger.log(`Creating department: ${request.name}`);

    // Check if department code already exists
    const existing = await this.prisma.department.findUnique({
      where: {
        tenantId_code: {
          tenantId: request.tenant_id!,
          code: request.code!,
        },
      },
    });

    if (existing) {
      throw new RpcException({
        code: 6, // ALREADY_EXISTS
        message: `Department code ${request.code} already exists`,
      });
    }

    // Validate parent department exists if provided
    if (request.parent_id) {
      const parent = await this.prisma.department.findFirst({
        where: {
          id: request.parent_id,
          tenantId: request.tenant_id!,
        },
      });

      if (!parent) {
        throw new RpcException({
          code: 5, // NOT_FOUND
          message: `Parent department with ID ${request.parent_id} not found`,
        });
      }
    }

    try {
      const departmentData: Prisma.DepartmentCreateInput = {
        tenantId: request.tenant_id!,
        name: request.name!,
        code: request.code!,
        description: request.description || undefined,
        managerId: request.manager_id || undefined,
      };

      if (request.parent_id) {
        departmentData.parent = {
          connect: { id: request.parent_id },
        };
      }

      return await this.prisma.department.create({
        data: departmentData,
        include: {
          parent: true,
          children: true,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create department: ${error.message}`, error.stack);
      throw new RpcException({
        code: 13, // INTERNAL
        message: 'Failed to create department',
      });
    }
  }

  /**
   * Get department by ID (with caching)
   */
  async getDepartmentById(id: string, tenantId: string): Promise<Department> {
    const cacheKey = `department:${tenantId}:${id}`;

    // Try cache first
    let department = await this.cacheManager.get<Department>(cacheKey);

    if (department) {
      this.logger.debug(`Cache hit for department: ${id}`);
      return department;
    }

    // Cache miss - fetch from database
    this.logger.debug(`Cache miss for department: ${id}`);
    department = await this.prisma.department.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!department) {
      throw new RpcException({
        code: 5, // NOT_FOUND
        message: `Department with ID ${id} not found`,
      });
    }

    // Store in cache
    await this.cacheManager.set(cacheKey, department, this.CACHE_TTL * 1000);

    return department;
  }

  /**
   * Update department
   */
  async updateDepartment(request: UpdateDepartmentRequest): Promise<Department> {
    this.logger.log(`Updating department: ${request.id}`);

    // Check if department exists
    const existing = await this.prisma.department.findFirst({
      where: {
        id: request.id!,
        tenantId: request.tenant_id!,
      },
    });

    if (!existing) {
      throw new RpcException({
        code: 5, // NOT_FOUND
        message: `Department with ID ${request.id} not found`,
      });
    }

    // Validate parent department exists if being updated
    if (request.parent_id) {
      // Prevent circular reference
      if (request.parent_id === request.id) {
        throw new RpcException({
          code: 3, // INVALID_ARGUMENT
          message: 'A department cannot be its own parent',
        });
      }

      const parent = await this.prisma.department.findFirst({
        where: {
          id: request.parent_id,
          tenantId: request.tenant_id!,
        },
      });

      if (!parent) {
        throw new RpcException({
          code: 5, // NOT_FOUND
          message: `Parent department with ID ${request.parent_id} not found`,
        });
      }
    }

    try {
      const updateData: Prisma.DepartmentUpdateInput = {};

      if (request.name) updateData.name = request.name;
      if (request.description !== undefined) updateData.description = request.description;
      if (request.manager_id !== undefined) updateData.managerId = request.manager_id;
      if (request.is_active !== undefined) updateData.isActive = request.is_active;

      if (request.parent_id) {
        updateData.parent = {
          connect: { id: request.parent_id },
        };
      }

      const updatedDepartment = await this.prisma.department.update({
        where: {
          id: request.id!,
          tenantId: request.tenant_id!,
        },
        data: updateData,
        include: {
          parent: true,
          children: true,
        },
      });

      // Invalidate cache
      const cacheKey = `department:${request.tenant_id}:${request.id}`;
      await this.cacheManager.del(cacheKey);
      this.logger.debug(`Invalidated cache for department: ${request.id}`);

      return updatedDepartment;
    } catch (error) {
      this.logger.error(`Failed to update department: ${error.message}`, error.stack);
      throw new RpcException({
        code: 13, // INTERNAL
        message: 'Failed to update department',
      });
    }
  }

  /**
   * Delete department
   */
  async deleteDepartment(id: string, tenantId: string): Promise<void> {
    this.logger.log(`Deleting department: ${id}`);

    // Check if department exists
    const department = await this.prisma.department.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!department) {
      throw new RpcException({
        code: 5, // NOT_FOUND
        message: `Department with ID ${id} not found`,
      });
    }

    // Check if department has employees
    const employeeCount = await this.employeeRepository.countByDepartment(id, tenantId);

    if (employeeCount > 0) {
      throw new RpcException({
        code: 9, // FAILED_PRECONDITION
        message: `Cannot delete department with ${employeeCount} active employees`,
      });
    }

    // Check if department has child departments
    const childCount = await this.prisma.department.count({
      where: {
        parentId: id,
        tenantId,
      },
    });

    if (childCount > 0) {
      throw new RpcException({
        code: 9, // FAILED_PRECONDITION
        message: `Cannot delete department with ${childCount} child departments`,
      });
    }

    await this.prisma.department.delete({
      where: {
        id,
        tenantId,
      },
    });

    // Invalidate cache
    const cacheKey = `department:${tenantId}:${id}`;
    await this.cacheManager.del(cacheKey);
    this.logger.debug(`Invalidated cache for deleted department: ${id}`);
  }

  /**
   * List departments with pagination and filters
   */
  async listDepartments(request: ListDepartmentsRequest): Promise<{
    departments: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = request.page || 1;
    const limit = request.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.DepartmentWhereInput = {
      tenantId: request.tenant_id!,
    };

    if (request.is_active !== undefined) {
      where.isActive = request.is_active;
    }

    if (request.parent_id !== undefined) {
      where.parentId = request.parent_id || null;
    }

    const [departments, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          name: 'asc',
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      this.prisma.department.count({ where }),
    ]);

    // Add employee count to each department
    const departmentsWithCount = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await this.employeeRepository.countByDepartment(
          dept.id,
          request.tenant_id!,
        );
        return {
          ...dept,
          employee_count: employeeCount,
        };
      }),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      departments: departmentsWithCount,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
