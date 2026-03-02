import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Tenant ID for multi-tenant isolation',
    example: 'tenant-123',
  })
  @IsString()
  tenant_id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123!',
  })
  @IsString()
  password: string;
}

export class UserDto {
  @ApiProperty({ example: 'user-uuid-123' })
  id: string;

  @ApiProperty({ example: 'tenant-123' })
  tenant_id: string;

  @ApiProperty({ example: 'john.doe@example.com', required: true })
  email: string;

  @ApiProperty({ example: 'johndoe', required: true })
  username?: string;

  @ApiProperty({ example: 'John', required: true })
  first_name: string;

  @ApiProperty({ example: 'Doe', required: true })
  last_name: string;

  @ApiProperty({ example: '+254712345678', required: true })
  phone_number?: string;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: false, required: true })
  email_verified: boolean;

  @ApiProperty({ example: ['employee'], type: [String] })
  roles: string[];
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 900,
  })
  expires_in: number;

  @ApiProperty({
    description: 'Authenticated user information',
    type: UserDto,
  })
  user: UserDto;
}
