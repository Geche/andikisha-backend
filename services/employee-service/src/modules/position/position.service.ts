import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '@andikisha/database';
import {
  CreatePositionRequest,
  UpdatePositionRequest,
  ListPositionsRequest,
} from '../../proto/employee.pb';
import { Position, Prisma } from '@prisma/client';
import { EmployeeRepository } from '../employee/employee.repository';

@Injectable()
export class PositionService {
  private readonly logger = new Logger(PositionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  /**
   * Create a new position
   */
  async createPosition(request: CreatePositionRequest): Promise<Position> {
    this.logger.log(`Creating position: ${request.title}`);

    // Check if position code already exists
    const existing = await this.prisma.position.findUnique({
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
        message: `Position code ${request.code} already exists`,
      });
    }

    // Validate department exists if provided
    if (request.department_id) {
      const department = await this.prisma.department.findFirst({
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

    try {
      const positionData: Prisma.PositionCreateInput = {
        tenantId: request.tenant_id!,
        title: request.title!,
        code: request.code!,
        description: request.description || undefined,
        level: request.level || 1,
        minSalary: request.min_salary ? request.min_salary : undefined,
        maxSalary: request.max_salary ? request.max_salary : undefined,
      };

      if (request.department_id) {
        positionData.department = {
          connect: { id: request.department_id },
        };
      }

      return await this.prisma.position.create({
        data: positionData,
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create position: ${error.message}`, error.stack);
      throw new RpcException({
        code: 13, // INTERNAL
        message: 'Failed to create position',
      });
    }
  }

  /**
   * Get position by ID
   */
  async getPositionById(id: string, tenantId: string): Promise<Position> {
    const position = await this.prisma.position.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!position) {
      throw new RpcException({
        code: 5, // NOT_FOUND
        message: `Position with ID ${id} not found`,
      });
    }

    return position;
  }

  /**
   * Update position
   */
  async updatePosition(request: UpdatePositionRequest): Promise<Position> {
    this.logger.log(`Updating position: ${request.id}`);

    // Check if position exists
    const existing = await this.prisma.position.findFirst({
      where: {
        id: request.id!,
        tenantId: request.tenant_id!,
      },
    });

    if (!existing) {
      throw new RpcException({
        code: 5, // NOT_FOUND
        message: `Position with ID ${request.id} not found`,
      });
    }

    // Validate department exists if being updated
    if (request.department_id) {
      const department = await this.prisma.department.findFirst({
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

    try {
      const updateData: Prisma.PositionUpdateInput = {};

      if (request.title) updateData.title = request.title;
      if (request.description !== undefined) updateData.description = request.description;
      if (request.level) updateData.level = request.level;
      if (request.min_salary !== undefined) updateData.minSalary = request.min_salary;
      if (request.max_salary !== undefined) updateData.maxSalary = request.max_salary;
      if (request.is_active !== undefined) updateData.isActive = request.is_active;

      if (request.department_id) {
        updateData.department = {
          connect: { id: request.department_id },
        };
      }

      return await this.prisma.position.update({
        where: {
          id: request.id!,
          tenantId: request.tenant_id!,
        },
        data: updateData,
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update position: ${error.message}`, error.stack);
      throw new RpcException({
        code: 13, // INTERNAL
        message: 'Failed to update position',
      });
    }
  }

  /**
   * Delete position
   */
  async deletePosition(id: string, tenantId: string): Promise<void> {
    this.logger.log(`Deleting position: ${id}`);

    // Check if position exists
    const position = await this.prisma.position.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!position) {
      throw new RpcException({
        code: 5, // NOT_FOUND
        message: `Position with ID ${id} not found`,
      });
    }

    // Check if position has employees
    const employeeCount = await this.employeeRepository.countByPosition(id, tenantId);

    if (employeeCount > 0) {
      throw new RpcException({
        code: 9, // FAILED_PRECONDITION
        message: `Cannot delete position with ${employeeCount} active employees`,
      });
    }

    await this.prisma.position.delete({
      where: {
        id,
        tenantId,
      },
    });
  }

  /**
   * List positions with pagination and filters
   */
  async listPositions(request: ListPositionsRequest): Promise<{
    positions: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = request.page || 1;
    const limit = request.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.PositionWhereInput = {
      tenantId: request.tenant_id!,
    };

    if (request.is_active !== undefined) {
      where.isActive = request.is_active;
    }

    if (request.department_id) {
      where.departmentId = request.department_id;
    }

    const [positions, total] = await Promise.all([
      this.prisma.position.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          title: 'asc',
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      this.prisma.position.count({ where }),
    ]);

    // Add employee count to each position
    const positionsWithCount = await Promise.all(
      positions.map(async (pos) => {
        const employeeCount = await this.employeeRepository.countByPosition(
          pos.id,
          request.tenant_id!,
        );
        return {
          ...pos,
          employee_count: employeeCount,
        };
      }),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      positions: positionsWithCount,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
