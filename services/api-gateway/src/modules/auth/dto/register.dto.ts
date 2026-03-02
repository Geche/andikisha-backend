import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsArray } from 'class-validator';

export class RegisterDto {
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
    description: 'User password (minimum 8 characters)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  first_name: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  last_name: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+254712345678',
  })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional({
    description: 'User roles (default: employee)',
    example: ['employee'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  role_names?: string[];
}

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Created user ID',
    example: 'user-uuid-123',
  })
  user_id: string;

  @ApiProperty({
    description: 'User email',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Success message',
    example: 'User registered successfully',
  })
  message: string;
}
