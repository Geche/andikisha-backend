import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from '@andikisha/database';
import { RoleService } from './modules/role/role.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    RoleModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly roleService: RoleService) {}

  /**
   * Initialize default system roles when the module starts
   */
  async onModuleInit() {
    // Create default system roles if they don't exist
    await this.roleService.createDefaultSystemRoles();
    console.log('Default system roles initialized');
  }
}
