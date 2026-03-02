import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsString, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { EmploymentStatus } from './update-employee.dto';

export class ListEmployeesDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Sort field', example: 'createdAt' })
  @IsOptional()
  @IsString()
  sort_by?: string;

  @ApiPropertyOptional({ description: 'Sort order', example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Filter by department ID', example: 'dept-uuid' })
  @IsOptional()
  @IsUUID()
  department_id?: string;

  @ApiPropertyOptional({ description: 'Filter by position ID', example: 'pos-uuid' })
  @IsOptional()
  @IsUUID()
  position_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by employment status',
    enum: EmploymentStatus,
    example: EmploymentStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(EmploymentStatus)
  employment_status?: EmploymentStatus;

  @ApiPropertyOptional({
    description: 'Search by name, email, or employee number',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
