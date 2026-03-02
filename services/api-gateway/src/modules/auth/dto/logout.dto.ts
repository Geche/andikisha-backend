import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Logout success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Logout message',
    example: 'Logged out successfully',
  })
  message: string;
}
