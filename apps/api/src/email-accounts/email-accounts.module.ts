import { Module } from "@nestjs/common";
import { AuditModule } from "@/audit/audit.module";
import { DatabaseModule } from "@/database/database.module";
import { EmailAccountsController } from "@/email-accounts/email-accounts.controller";
import { EmailAccountsService } from "@/email-accounts/email-accounts.service";
import { EmailProviderAdapter } from "@/email-accounts/email-provider.adapter";
import { SecretCryptoService } from "@/email-accounts/secret-crypto.service";

@Module({
  imports: [AuditModule, DatabaseModule],
  controllers: [EmailAccountsController],
  providers: [EmailAccountsService, EmailProviderAdapter, SecretCryptoService],
  exports: [SecretCryptoService],
})
export class EmailAccountsModule {}
