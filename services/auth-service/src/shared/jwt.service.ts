import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  tenantId: string;
  roles: string[];
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
}

@Injectable()
export class JwtService {
  private readonly accessTokenExpiration: string;
  private readonly refreshTokenExpiration: string;

  constructor(
    private readonly nestJwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenExpiration =
      this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION') || '15m';
    this.refreshTokenExpiration =
      this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION') || '7d';
  }

  /**
   * Generate access and refresh tokens
   * @param userId User ID
   * @param email User email
   * @param tenantId Tenant ID
   * @param roles User roles
   * @returns Token pair (access token and refresh token)
   */
  async generateTokenPair(
    userId: string,
    email: string,
    tenantId: string,
    roles: string[],
  ): Promise<TokenPair> {
    const accessToken = await this.generateAccessToken(userId, email, tenantId, roles);
    const refreshToken = await this.generateRefreshToken(userId, email, tenantId, roles);

    // Calculate expiration in seconds
    const expiresIn = this.getExpirationInSeconds(this.accessTokenExpiration);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Generate an access token
   * @param userId User ID
   * @param email User email
   * @param tenantId Tenant ID
   * @param roles User roles
   * @returns JWT access token
   */
  async generateAccessToken(
    userId: string,
    email: string,
    tenantId: string,
    roles: string[],
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      tenantId,
      roles,
      type: 'access',
    };

    return this.nestJwtService.signAsync(payload, {
      expiresIn: this.accessTokenExpiration,
    });
  }

  /**
   * Generate a refresh token
   * @param userId User ID
   * @param email User email
   * @param tenantId Tenant ID
   * @param roles User roles
   * @returns JWT refresh token
   */
  async generateRefreshToken(
    userId: string,
    email: string,
    tenantId: string,
    roles: string[],
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      tenantId,
      roles,
      type: 'refresh',
    };

    return this.nestJwtService.signAsync(payload, {
      expiresIn: this.refreshTokenExpiration,
    });
  }

  /**
   * Verify and decode a JWT token
   * @param token JWT token
   * @returns Decoded payload
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.nestJwtService.verifyAsync<JwtPayload>(token);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Decode a JWT token without verification (use with caution)
   * @param token JWT token
   * @returns Decoded payload
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return this.nestJwtService.decode(token) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get expiration date from a token
   * @param token JWT token
   * @returns Expiration date or null
   */
  getTokenExpiration(token: string): Date | null {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded['exp']) {
      return null;
    }
    return new Date(decoded['exp'] * 1000);
  }

  /**
   * Convert expiration string to seconds
   * @param expiration Expiration string (e.g., "15m", "7d")
   * @returns Expiration in seconds
   */
  private getExpirationInSeconds(expiration: string): number {
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return 900; // default 15 minutes
    }
  }
}
