import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { HashService } from '../../shared/hash.service';
import { PrismaModule } from '@andikisha/database';

@Module({
  imports: [PrismaModule],
  providers: [UserService, UserRepository, HashService],
  exports: [UserService, UserRepository],
})
export class UserModule {}
