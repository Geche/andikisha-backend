import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@andikisha/database';
import { UserService } from '../user/user.service';
import { RoleService} from '../role/role.service';
import { JwtService, TokenPair } from '../../shared/jwt.service';

export interface RegisterDto {
  tenantId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roleNames?: string[];
}

export interface LoginDto {
  tenantId: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    tenantId: string;
    email: string;
    username?: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    isActive: boolean;
    emailVerified: boolean;
    roles: string[];
  };
}

export interface ValidateTokenResponse {
  isValid: boolean;
  userId?: string;
  tenantId?: string;
  roles?: string[];
  permissions?: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   * @param data Registration data
   * @returns Created user info
   *
   * USES TRANSACTION: Ensures user creation and role assignment are atomic.
   * If role assignment fails, user creation is rolled back.
   */
  async register(data: RegisterDto): Promise<{ userId: string; email: string; message: string }> {
    // Validate password strength
    this.validatePasswordStrength(data.password);

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await this.userService.createUser(
        {
          tenantId: data.tenantId,
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
        },
        tx,
      );

      // Assign roles if provided
      if (data.roleNames && data.roleNames.length > 0) {
        const roleIds = await this.roleService.getRoleIdsByNames(data.roleNames, data.tenantId, tx);

        if (roleIds.length === 0) {
          throw new BadRequestException('No valid roles found');
        }

        await this.userService.assignRoles(user.id, roleIds, tx);
      } else {
        // Assign default 'employee' role
        const employeeRole = await this.roleService.findRoleByName('employee', null, tx);
        if (employeeRole) {
          await this.userService.assignRoles(user.id, [employeeRole.id], tx);
        }
      }

      return {
        userId: user.id,
        email: user.email,
        message: 'User registered successfully',
      };
    });

    return result;
  }

  /**
   * Login a user
   * @param data Login credentials
   * @returns Access and refresh tokens with user info
   *
   * USES TRANSACTION: Ensures token storage, last login update, and session creation are atomic.
   */
  async login(data: LoginDto): Promise<LoginResponse> {
    // Validate user credentials
    const user = await this.userService.validateUserPassword(
      data.email,
      data.password,
      data.tenantId,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // Get user roles
    const roles = await this.userService.getUserRoleNames(user.id);

    // Generate JWT tokens
    const tokens = await this.jwtService.generateTokenPair(
      user.id,
      user.email,
      user.tenantId,
      roles,
    );

    // Use transaction for all post-auth database operations
    await this.prisma.$transaction(async (tx) => {
      // Store refresh token
      const expiresAt = this.jwtService.getTokenExpiration(tokens.refreshToken);
      if (expiresAt) {
        await tx.refreshToken.create({
          data: {
            userId: user.id,
            token: tokens.refreshToken,
            expiresAt,
          },
        });
      }

      // Update last login
      await tx.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Create session record
      const sessionExpiresAt = this.jwtService.getTokenExpiration(tokens.accessToken);
      if (sessionExpiresAt) {
        await tx.session.create({
          data: {
            userId: user.id,
            token: tokens.accessToken,
            expiresAt: sessionExpiresAt,
            ipAddress: null,
            userAgent: null,
          },
        });
      }
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        username: user.username || undefined,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber || undefined,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        roles,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken Refresh token
   * @returns New access and refresh tokens
   *
   * USES TRANSACTION: Ensures old token revocation and new token storage are atomic.
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    // Verify refresh token
    let payload;
    try {
      payload = await this.jwtService.verifyToken(refreshToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Check if refresh token exists in database and not revoked
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: payload.sub,
        isRevoked: false,
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found or revoked');
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Get user roles
    const roles = await this.userService.getUserRoleNames(payload.sub);

    // Generate new token pair
    const tokens = await this.jwtService.generateTokenPair(
      payload.sub,
      payload.email,
      payload.tenantId,
      roles,
    );

    // Use transaction to revoke old token and store new one atomically
    await this.prisma.$transaction(async (tx) => {
      // Revoke old refresh token
      await tx.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isRevoked: true },
      });

      // Store new refresh token
      const expiresAt = this.jwtService.getTokenExpiration(tokens.refreshToken);
      if (expiresAt) {
        await tx.refreshToken.create({
          data: {
            userId: payload.sub,
            token: tokens.refreshToken,
            expiresAt,
          },
        });
      }
    });

    return tokens;
  }

  /**
   * Validate an access token
   * @param accessToken Access token
   * @returns Validation result with user info
   */
  async validateToken(accessToken: string): Promise<ValidateTokenResponse> {
    try {
      const payload = await this.jwtService.verifyToken(accessToken);

      if (payload.type !== 'access') {
        return { isValid: false };
      }

      // Get user permissions
      const permissions = await this.userService.getUserPermissions(payload.sub);
      const permissionStrings = permissions.map((p) => `${p.resource}:${p.action}`);

      return {
        isValid: true,
        userId: payload.sub,
        tenantId: payload.tenantId,
        roles: payload.roles,
        permissions: permissionStrings,
      };
    } catch (error) {
      return { isValid: false };
    }
  }

  /**
   * Logout a user (revoke tokens)
   * @param accessToken Access token
   * @returns Logout result
   *
   * USES TRANSACTION: Ensures token revocation and session deletion are atomic.
   */
  async logout(accessToken: string): Promise<{ success: boolean; message: string }> {
    try {
      const payload = await this.jwtService.verifyToken(accessToken);

      // Use transaction to revoke tokens and delete sessions atomically
      await this.prisma.$transaction(async (tx) => {
        // Revoke all refresh tokens for this user
        await tx.refreshToken.updateMany({
          where: {
            userId: payload.sub,
            isRevoked: false,
          },
          data: {
            isRevoked: true,
          },
        });

        // Delete active sessions
        await tx.session.deleteMany({
          where: {
            userId: payload.sub,
          },
        });
      });

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Get user by ID
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns User info with roles
   */
  async getUserById(userId: string, tenantId: string) {
    const user = await this.userService.findUserByIdWithRoles(userId, tenantId);

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
      roles: user.roles,
    };
  }

  /**
   * Store refresh token in database
   * @param userId User ID
   * @param token Refresh token
   */
  private async storeRefreshToken(userId: string, token: string): Promise<void> {
    const expiresAt = this.jwtService.getTokenExpiration(token);

    if (!expiresAt) {
      throw new Error('Invalid token - no expiration');
    }

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  /**
   * Revoke a refresh token
   * @param token Refresh token
   */
  private async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true },
    });
  }

  /**
   * Create a session record
   * @param userId User ID
   * @param token Access token
   */
  private async createSession(userId: string, token: string): Promise<void> {
    const expiresAt = this.jwtService.getTokenExpiration(token);

    if (!expiresAt) {
      return;
    }

    await this.prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress: null,
        userAgent: null,
      },
    });
  }

  /**
   * Validate password strength
   * @param password Password to validate
   */
  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    // Add more password validation rules as needed
    // e.g., require uppercase, lowercase, numbers, special characters
  }
}
