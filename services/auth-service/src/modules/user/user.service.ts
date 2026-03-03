import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { HashService } from '../../shared/hash.service';
import { User, Permission, Prisma } from '@prisma/client';
import { PrismaService } from '@andikisha/database';

// Transaction client type
type TransactionClient = Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export interface CreateUserDto {
  tenantId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  username?: string;
  roleNames?: string[];
}

export interface UserWithRolesAndPermissions {
  id: string;
  tenantId: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  roles: string[];
  permissions: Permission[];
}

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
  ) {}

  /**
   * Create a new user with hashed password
   * @param data User creation data
   * @param tx Optional transaction client
   * @returns Created user
   */
  async createUser(data: CreateUserDto, tx?: TransactionClient): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email, data.tenantId, tx);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashService.hashPassword(data.password);

    // Create user
    const user = await this.userRepository.create({
      tenantId: data.tenantId,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      username: data.username,
    }, tx);

    return user;
  }

  /**
   * Find user by ID with roles and permissions
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns User with roles and permissions
   */
  async findUserByIdWithRoles(
    userId: string,
    tenantId: string,
  ): Promise<UserWithRolesAndPermissions> {
    const user = await this.userRepository.findByIdWithRoles(userId, tenantId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.transformUserWithRoles(user);
  }

  /**
   * Find user by email with roles and permissions
   * @param email User email
   * @param tenantId Tenant ID
   * @returns User with roles and permissions
   */
  async findUserByEmailWithRoles(
    email: string,
    tenantId: string,
  ): Promise<UserWithRolesAndPermissions> {
    const user = await this.userRepository.findByEmailWithRoles(email, tenantId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.transformUserWithRoles(user);
  }

  /**
   * Find user by email (basic info without roles)
   * @param email User email
   * @param tenantId Tenant ID
   * @returns User or null
   */
  async findUserByEmail(email: string, tenantId: string): Promise<User | null> {
    return this.userRepository.findByEmail(email, tenantId);
  }

  /**
   * Validate user password
   * @param email User email
   * @param password Plain text password
   * @param tenantId Tenant ID
   * @returns User if valid, null otherwise
   */
  async validateUserPassword(
    email: string,
    password: string,
    tenantId: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email, tenantId);

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.hashService.comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Update user's last login timestamp
   * @param userId User ID
   * @returns Updated user
   */
  async updateLastLogin(userId: string): Promise<User> {
    return this.userRepository.updateLastLogin(userId);
  }

  /**
   * Change user's password
   * @param userId User ID
   * @param newPassword New plain text password
   * @returns Updated user
   */
  async changePassword(userId: string, newPassword: string): Promise<User> {
    const passwordHash = await this.hashService.hashPassword(newPassword);
    return this.userRepository.updatePassword(userId, passwordHash);
  }

  /**
   * Assign roles to user
   * @param userId User ID
   * @param roleIds Array of role IDs
   * @param tx Optional transaction client
   */
  async assignRoles(userId: string, roleIds: string[], tx?: TransactionClient): Promise<void> {
    return this.userRepository.assignRoles(userId, roleIds, tx);
  }

  /**
   * Get user's role names
   * @param userId User ID
   * @returns Array of role names
   */
  async getUserRoleNames(userId: string): Promise<string[]> {
    return this.userRepository.getUserRoleNames(userId);
  }

  /**
   * Get user's permissions
   * @param userId User ID
   * @returns Array of permissions
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    return this.userRepository.getUserPermissions(userId);
  }

  /**
   * Deactivate user
   * @param userId User ID
   * @returns Updated user
   */
  async deactivateUser(userId: string): Promise<User> {
    return this.userRepository.deactivate(userId);
  }

  /**
   * Activate user
   * @param userId User ID
   * @returns Updated user
   */
  async activateUser(userId: string): Promise<User> {
    return this.userRepository.activate(userId);
  }

  /**
   * Verify user's email
   * @param userId User ID
   * @returns Updated user
   */
  async verifyUserEmail(userId: string): Promise<User> {
    return this.userRepository.verifyEmail(userId);
  }

  /**
   * Transform user with roles from database format to service format
   * @param user User from database with roles
   * @returns Transformed user
   */
  private transformUserWithRoles(user: any): UserWithRolesAndPermissions {
    const roles = user.roles.map((ur: any) => ur.role.name);
    const permissions = user.roles.flatMap((ur: any) =>
      ur.role.permissions.map((rp: any) => rp.permission),
    );

    // Remove duplicate permissions
    const uniquePermissions = Array.from(new Map(permissions.map((p: any) => [p.id, p])).values());

    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin,
      roles,
      permissions: uniquePermissions as Permission[],
    };
  }
}
