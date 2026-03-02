import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
} from 'class-validator';

export enum Gender {
  MALE = 1,
  FEMALE = 2,
  OTHER = 3,
  PREFER_NOT_TO_SAY = 4,
}

export enum MaritalStatus {
  SINGLE = 1,
  MARRIED = 2,
  DIVORCED = 3,
  WIDOWED = 4,
  SEPARATED = 5,
}

export enum EmploymentType {
  FULL_TIME = 1,
  PART_TIME = 2,
  CONTRACT = 3,
  TEMPORARY = 4,
  INTERN = 5,
  CONSULTANT = 6,
}

export enum WorkSchedule {
  FULL_TIME_SCHEDULE = 1,
  PART_TIME_SCHEDULE = 2,
  FLEXIBLE = 3,
  REMOTE = 4,
  HYBRID = 5,
  SHIFT = 6,
}

export class CreateEmployeeDto {
  @ApiProperty({ description: 'Tenant ID', example: 'tenant-123' })
  @IsString()
  tenant_id: string;

  @ApiPropertyOptional({ description: 'User ID from Auth Service', example: 'user-uuid' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiProperty({ description: 'Employee number', example: 'EMP001' })
  @IsString()
  employee_number: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  @IsString()
  first_name: string;

  @ApiPropertyOptional({ description: 'Middle name', example: 'Doe' })
  @IsOptional()
  @IsString()
  middle_name?: string;

  @ApiProperty({ description: 'Last name', example: 'Smith' })
  @IsString()
  last_name: string;

  @ApiProperty({ description: 'Email address', example: 'john.smith@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Phone number', example: '+254712345678' })
  @IsString()
  phone_number: string;

  @ApiPropertyOptional({ description: 'Alternate phone number', example: '+254722345678' })
  @IsOptional()
  @IsString()
  alternate_phone?: string;

  @ApiProperty({ description: 'Date of birth', example: '1990-01-01' })
  @IsDateString()
  date_of_birth: string;

  @ApiProperty({ description: 'Gender', enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    description: 'Marital status',
    enum: MaritalStatus,
    example: MaritalStatus.SINGLE,
  })
  @IsEnum(MaritalStatus)
  marital_status: MaritalStatus;

  @ApiProperty({ description: 'Nationality', example: 'Kenyan' })
  @IsString()
  nationality: string;

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

  @ApiProperty({ description: 'Address line 1', example: '123 Main Street' })
  @IsString()
  address_line1: string;

  @ApiPropertyOptional({ description: 'Address line 2', example: 'Apartment 4B' })
  @IsOptional()
  @IsString()
  address_line2?: string;

  @ApiProperty({ description: 'City', example: 'Nairobi' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ description: 'State/County', example: 'Nairobi County' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Postal code', example: '00100' })
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiProperty({ description: 'Country', example: 'Kenya' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'Department ID', example: 'dept-uuid' })
  @IsOptional()
  @IsUUID()
  department_id?: string;

  @ApiPropertyOptional({ description: 'Position ID', example: 'pos-uuid' })
  @IsOptional()
  @IsUUID()
  position_id?: string;

  @ApiProperty({
    description: 'Employment type',
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME,
  })
  @IsEnum(EmploymentType)
  employment_type: EmploymentType;

  @ApiProperty({ description: 'Hire date', example: '2024-01-01' })
  @IsDateString()
  hire_date: string;

  @ApiPropertyOptional({ description: 'Probation end date', example: '2024-03-31' })
  @IsOptional()
  @IsDateString()
  probation_end_date?: string;

  @ApiPropertyOptional({ description: 'Manager ID', example: 'mgr-uuid' })
  @IsOptional()
  @IsUUID()
  manager_id?: string;

  @ApiProperty({
    description: 'Work schedule',
    enum: WorkSchedule,
    example: WorkSchedule.FULL_TIME_SCHEDULE,
  })
  @IsEnum(WorkSchedule)
  work_schedule: WorkSchedule;

  @ApiPropertyOptional({ description: 'Work location', example: 'Head Office - Nairobi' })
  @IsOptional()
  @IsString()
  work_location?: string;
}
