import { Injectable } from '@nestjs/common';
import { PrismaService } from '@andikisha/database';
import { User, Role, Permission, Prisma } from '@prisma/client';

// Transaction client type
type TransactionClient = Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export type UserWithRoles = User & {
  roles: {
    role: Role & {
      permissions: {
        permission: Permission;
      }[];
    };
  }[];
};

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a user by ID with roles and permissions
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns User with roles and permissions or null
   */
  async findByIdWithRoles(userId: string, tenantId: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
        isActive: true,
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find a user by email
   * @param email User email
   * @param tenantId Tenant ID
   * @param tx Optional transaction client
   * @returns User or null
   */
  async findByEmail(email: string, tenantId: string, tx?: TransactionClient): Promise<User | null> {
    const client = tx || this.prisma;
    return client.user.findFirst({
      where: {
        email,
        tenantId,
      },
    });
  }

  /**
   * Find a user by email with roles and permissions
   * @param email User email
   * @param tenantId Tenant ID
   * @returns User with roles and permissions or null
   */
  async findByEmailWithRoles(email: string, tenantId: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findFirst({
      where: {
        email,
        tenantId,
        isActive: true,
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Create a new user
   * @param data User data
   * @param tx Optional transaction client
   * @returns Created user
   */
  async create(data: {
    tenantId: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    username?: string;
  }, tx?: TransactionClient): Promise<User> {
    const client = tx || this.prisma;
    return client.user.create({
      data,
    });
  }

  /**
   * Update user's last login timestamp
   * @param userId User ID
   * @returns Updated user
   */
  async updateLastLogin(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLogin: new Date(),
      },
    });
  }

  /**
   * Update user's password hash
   * @param userId User ID
   * @param passwordHash New password hash
   * @returns Updated user
   */
  async updatePassword(userId: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
      },
    });
  }

  /**
   * Assign roles to a user
   * @param userId User ID
   * @param roleIds Array of role IDs
   * @param tx Optional transaction client
   * @returns Created user roles
   */
  async assignRoles(userId: string, roleIds: string[], tx?: TransactionClient): Promise<void> {
    const client = tx || this.prisma;
    await client.userRole.createMany({
      data: roleIds.map((roleId) => ({
        userId,
        roleId,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Remove all roles from a user
   * @param userId User ID
   */
  async removeAllRoles(userId: string): Promise<void> {
    await this.prisma.userRole.deleteMany({
      where: { userId },
    });
  }

  /**
   * Get user's role names
   * @param userId User ID
   * @returns Array of role names
   */
  async getUserRoleNames(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    return userRoles.map((ur) => ur.role.name);
  }

  /**
   * Get user's permissions
   * @param userId User ID
   * @returns Array of permissions
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const userWithRoles = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userWithRoles) {
      return [];
    }

    // Flatten permissions and remove duplicates
    const permissions = userWithRoles.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission),
    );

    // Remove duplicates based on permission ID
    return Array.from(new Map(permissions.map((p) => [p.id, p])).values());
  }

  /**
   * Deactivate a user
   * @param userId User ID
   * @returns Updated user
   */
  async deactivate(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Activate a user
   * @param userId User ID
   * @returns Updated user
   */
  async activate(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
      },
    });
  }

  /**
   * Verify user's email
   * @param userId User ID
   * @returns Updated user
   */
  async verifyEmail(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
      },
    });
  }
}
