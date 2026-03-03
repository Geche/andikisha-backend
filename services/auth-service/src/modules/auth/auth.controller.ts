import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';

// Proto message interfaces (auto-generated types)
interface RegisterRequest {
  tenant_id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role_names?: string[];
}

interface RegisterResponse {
  user_id: string;
  email: string;
  message: string;
}

interface LoginRequest {
  tenant_id: string;
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    tenant_id: string;
    email: string;
    username?: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    is_active: boolean;
    email_verified: boolean;
    roles: string[];
  };
}

interface RefreshTokenRequest {
  refresh_token: string;
}

interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface ValidateTokenRequest {
  access_token: string;
}

interface ValidateTokenResponse {
  is_valid: boolean;
  user_id?: string;
  tenant_id?: string;
  roles?: string[];
  permissions?: string[];
}

interface LogoutRequest {
  access_token: string;
}

interface LogoutResponse {
  success: boolean;
  message: string;
}

interface GetUserByIdRequest {
  user_id: string;
  tenant_id: string;
}

interface UserResponse {
  user: {
    id: string;
    tenant_id: string;
    email: string;
    username?: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    is_active: boolean;
    email_verified: boolean;
    roles: string[];
  };
}

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   */
  @GrpcMethod('AuthService', 'Register')
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const result = await this.authService.register({
      tenantId: data.tenant_id,
      email: data.email,
      password: data.password,
      firstName: data.first_name,
      lastName: data.last_name,
      phoneNumber: data.phone_number,
      roleNames: data.role_names,
    });

    return {
      user_id: result.userId,
      email: result.email,
      message: result.message,
    };
  }

  /**
   * Login a user
   */
  @GrpcMethod('AuthService', 'Login')
  async login(data: LoginRequest): Promise<LoginResponse> {
    const result = await this.authService.login({
      tenantId: data.tenant_id,
      email: data.email,
      password: data.password,
    });

    return {
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      expires_in: result.expiresIn,
      user: {
        id: result.user.id,
        tenant_id: result.user.tenantId,
        email: result.user.email,
        username: result.user.username,
        first_name: result.user.firstName,
        last_name: result.user.lastName,
        phone_number: result.user.phoneNumber,
        is_active: result.user.isActive,
        email_verified: result.user.emailVerified,
        roles: result.user.roles,
      },
    };
  }

  /**
   * Refresh access token
   */
  @GrpcMethod('AuthService', 'RefreshToken')
  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const result = await this.authService.refreshToken(data.refresh_token);

    return {
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      expires_in: result.expiresIn,
    };
  }

  /**
   * Validate an access token
   */
  @GrpcMethod('AuthService', 'ValidateToken')
  async validateToken(data: ValidateTokenRequest): Promise<ValidateTokenResponse> {
    const result = await this.authService.validateToken(data.access_token);

    return {
      is_valid: result.isValid,
      user_id: result.userId,
      tenant_id: result.tenantId,
      roles: result.roles,
      permissions: result.permissions,
    };
  }

  /**
   * Logout a user
   */
  @GrpcMethod('AuthService', 'Logout')
  async logout(data: LogoutRequest): Promise<LogoutResponse> {
    const result = await this.authService.logout(data.access_token);

    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * Get user by ID
   */
  @GrpcMethod('AuthService', 'GetUserById')
  async getUserById(data: GetUserByIdRequest): Promise<UserResponse> {
    const user = await this.authService.getUserById(data.user_id, data.tenant_id);

    return {
      user: {
        id: user.id,
        tenant_id: user.tenantId,
        email: user.email,
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
        phone_number: user.phoneNumber,
        is_active: user.isActive,
        email_verified: user.emailVerified,
        roles: user.roles,
      },
    };
  }
}
