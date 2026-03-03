import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@andikisha/database';
import { Role, Prisma } from '@prisma/client';

// Transaction client type
type TransactionClient = Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find role by name
   * @param name Role name
   * @param tenantId Tenant ID (null for system roles)
   * @param tx Optional transaction client
   * @returns Role or null
   */
  async findRoleByName(name: string, tenantId: string | null = null, tx?: TransactionClient): Promise<Role | null> {
    const client = tx || this.prisma;
    return client.role.findFirst({
      where: {
        name,
        tenantId,
      },
    });
  }

  /**
   * Find roles by names
   * @param roleNames Array of role names
   * @param tenantId Tenant ID
   * @param tx Optional transaction client
   * @returns Array of roles
   */
  async findRolesByNames(roleNames: string[], tenantId: string, tx?: TransactionClient): Promise<Role[]> {
    const client = tx || this.prisma;
    return client.role.findMany({
      where: {
        name: {
          in: roleNames,
        },
        OR: [{ tenantId }, { isSystemRole: true, tenantId: null }],
      },
    });
  }

  /**
   * Get role IDs by role names
   * @param roleNames Array of role names
   * @param tenantId Tenant ID
   * @param tx Optional transaction client
   * @returns Array of role IDs
   */
  async getRoleIdsByNames(roleNames: string[], tenantId: string, tx?: TransactionClient): Promise<string[]> {
    const roles = await this.findRolesByNames(roleNames, tenantId, tx);
    return roles.map((role) => role.id);
  }

  /**
   * Create a new role
   * @param data Role data
   * @returns Created role
   */
  async createRole(data: {
    tenantId: string | null;
    name: string;
    description?: string;
    isSystemRole?: boolean;
  }): Promise<Role> {
    return this.prisma.role.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        isSystemRole: data.isSystemRole || false,
      },
    });
  }

  /**
   * Create default system roles if they don't exist
   * Creates: admin, hr_manager, employee
   */
  async createDefaultSystemRoles(): Promise<void> {
    const defaultRoles = [
      {
        name: 'admin',
        description: 'System administrator with full access',
        isSystemRole: true,
        tenantId: null,
      },
      {
        name: 'hr_manager',
        description: 'HR manager with access to employee and payroll management',
        isSystemRole: true,
        tenantId: null,
      },
      {
        name: 'employee',
        description: 'Regular employee with basic access',
        isSystemRole: true,
        tenantId: null,
      },
      {
        name: 'payroll_officer',
        description: 'Payroll officer with access to payroll processing',
        isSystemRole: true,
        tenantId: null,
      },
    ];

    for (const roleData of defaultRoles) {
      const existingRole = await this.findRoleByName(roleData.name, null);
      if (!existingRole) {
        await this.createRole(roleData);
      }
    }
  }

  /**
   * Get all roles for a tenant (including system roles)
   * @param tenantId Tenant ID
   * @returns Array of roles
   */
  async getRolesForTenant(tenantId: string): Promise<Role[]> {
    return this.prisma.role.findMany({
      where: {
        OR: [{ tenantId }, { isSystemRole: true, tenantId: null }],
      },
    });
  }

  /**
   * Assign permissions to a role
   * @param roleId Role ID
   * @param permissionIds Array of permission IDs
   */
  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void> {
    await this.prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Remove permissions from a role
   * @param roleId Role ID
   * @param permissionIds Array of permission IDs
   */
  async removePermissionsFromRole(roleId: string, permissionIds: string[]): Promise<void> {
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: {
          in: permissionIds,
        },
      },
    });
  }

  /**
   * Get all permissions for a role
   * @param roleId Role ID
   * @returns Array of permissions
   */
  async getRolePermissions(roleId: string) {
    const roleWithPermissions = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!roleWithPermissions) {
      throw new NotFoundException('Role not found');
    }

    return roleWithPermissions.permissions.map((rp) => rp.permission);
  }

  /**
   * Delete a role (only non-system roles)
   * @param roleId Role ID
   */
  async deleteRole(roleId: string): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystemRole) {
      throw new Error('Cannot delete system roles');
    }

    await this.prisma.role.delete({
      where: { id: roleId },
    });
  }

  /**
   * Update role
   * @param roleId Role ID
   * @param data Role update data
   * @returns Updated role
   */
  async updateRole(
    roleId: string,
    data: {
      name?: string;
      description?: string;
    },
  ): Promise<Role> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystemRole) {
      throw new Error('Cannot update system roles');
    }

    return this.prisma.role.update({
      where: { id: roleId },
      data,
    });
  }
}
