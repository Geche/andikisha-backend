import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { Gender, MaritalStatus, EmploymentType, WorkSchedule } from './create-employee.dto';

export enum EmploymentStatus {
  ACTIVE = 1,
  PROBATION = 2,
  ON_LEAVE = 3,
  SUSPENDED = 4,
  TERMINATED = 5,
  RESIGNED = 6,
  RETIRED = 7,
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({ description: 'Middle name', example: 'Doe' })
  @IsOptional()
  @IsString()
  middle_name?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Smith' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'john.smith@company.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+254712345678' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional({ description: 'Alternate phone number', example: '+254722345678' })
  @IsOptional()
  @IsString()
  alternate_phone?: string;

  @ApiPropertyOptional({ description: 'Gender', enum: Gender, example: Gender.MALE })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Marital status',
    enum: MaritalStatus,
    example: MaritalStatus.SINGLE,
  })
  @IsOptional()
  @IsEnum(MaritalStatus)
  marital_status?: MaritalStatus;

  @ApiPropertyOptional({ description: 'National ID', example: '12345678' })
  @IsOptional()
  @IsString()
  national_id?: string;

  @ApiPropertyOptional({ description: 'Passport number', example: 'A12345678' })
  @IsOptional()
  @IsString()
  passport_number?: string;

  @ApiPropertyOptional({ description: 'Tax ID (KRA PIN for Kenya)', example: 'A123456789Z' })
  @IsOptional()
  @IsString()
  tax_id?: string;

  @ApiPropertyOptional({ description: 'NSSF number', example: '123456789' })
  @IsOptional()
  @IsString()
  nssf_number?: string;

  @ApiPropertyOptional({ description: 'NHIF number', example: '987654321' })
  @IsOptional()
  @IsString()
  nhif_number?: string;

  @ApiPropertyOptional({ description: 'Address line 1', example: '123 Main Street' })
  @IsOptional()
  @IsString()
  address_line1?: string;

  @ApiPropertyOptional({ description: 'Address line 2', example: 'Apartment 4B' })
  @IsOptional()
  @IsString()
  address_line2?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Nairobi' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State/County', example: 'Nairobi County' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Postal code', example: '00100' })
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiPropertyOptional({ description: 'Country', example: 'Kenya' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Department ID', example: 'dept-uuid' })
  @IsOptional()
  @IsUUID()
  department_id?: string;

  @ApiPropertyOptional({ description: 'Position ID', example: 'pos-uuid' })
  @IsOptional()
  @IsUUID()
  position_id?: string;

  @ApiPropertyOptional({
    description: 'Employment type',
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME,
  })
  @IsOptional()
  @IsEnum(EmploymentType)
  employment_type?: EmploymentType;

  @ApiPropertyOptional({
    description: 'Employment status',
    enum: EmploymentStatus,
    example: EmploymentStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(EmploymentStatus)
  employment_status?: EmploymentStatus;

  @ApiPropertyOptional({ description: 'Confirmation date', example: '2024-04-01' })
  @IsOptional()
  @IsDateString()
  confirmation_date?: string;

  @ApiPropertyOptional({ description: 'Manager ID', example: 'mgr-uuid' })
  @IsOptional()
  @IsUUID()
  manager_id?: string;

  @ApiPropertyOptional({
    description: 'Work schedule',
    enum: WorkSchedule,
    example: WorkSchedule.FULL_TIME_SCHEDULE,
  })
  @IsOptional()
  @IsEnum(WorkSchedule)
  work_schedule?: WorkSchedule;

  @ApiPropertyOptional({ description: 'Work location', example: 'Head Office - Nairobi' })
  @IsOptional()
  @IsString()
  work_location?: string;
}
