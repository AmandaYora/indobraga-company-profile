import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuthController } from "@/auth/auth.controller";
import { AuthService } from "@/auth/auth.service";
import { CsrfGuard } from "@/auth/csrf.guard";
import { SessionAuthGuard } from "@/auth/session-auth.guard";
import { AuditModule } from "@/audit/audit.module";
import { DatabaseModule } from "@/database/database.module";

@Module({
  imports: [AuditModule, DatabaseModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: SessionAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
