import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { PrismaModule } from '@andikisha/database';

@Module({
  imports: [PrismaModule],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
