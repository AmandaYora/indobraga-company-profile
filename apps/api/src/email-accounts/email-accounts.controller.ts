import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res } from "@nestjs/common";
import { PublicRoute } from "@/auth/auth.decorators";
import { NoStore } from "@/core/cache-control.decorator";
import { IdParamDto } from "@/core/id-param.dto";
import { RequirePermissions } from "@/core/permissions.decorator";
import { GoogleOAuthCallbackQueryDto } from "@/email-accounts/dto/google-oauth-callback-query.dto";
import { GoogleOAuthUrlDto } from "@/email-accounts/dto/google-oauth-url.dto";
import { ListEmailAccountsQueryDto } from "@/email-accounts/dto/list-email-accounts-query.dto";
import { SmtpAccountDto } from "@/email-accounts/dto/smtp-account.dto";
import { UpdateEmailAccountDto } from "@/email-accounts/dto/update-email-account.dto";
import { EmailAccountsService } from "@/email-accounts/email-accounts.service";
import type { Request, Response } from "express";

function actor(request: Request) {
  return { id: request.adminUser?.id };
}

@Controller()
@NoStore()
export class EmailAccountsController {
  constructor(private readonly emailAccounts: EmailAccountsService) {}

  @Get("admin/email-accounts")
  @RequirePermissions("email_accounts.read")
  list(@Query() query: ListEmailAccountsQueryDto) {
    return this.emailAccounts.list(query);
  }

  @Post("admin/email-accounts/google/oauth-url")
  @RequirePermissions("email_accounts.manage")
  googleOAuthUrl(@Body() dto: GoogleOAuthUrlDto, @Req() request: Request) {
    return this.emailAccounts.createGoogleOAuthUrl(dto, actor(request));
  }

  @Get("oauth/google/email/callback")
  @PublicRoute()
  async googleCallback(
    @Query() query: GoogleOAuthCallbackQueryDto,
    @Res() response: Response,
  ): Promise<void> {
    const redirectTo = await this.emailAccounts.handleGoogleCallback(query);
    response.redirect(302, redirectTo);
  }

  @Post("admin/email-accounts/smtp/test")
  @RequirePermissions("email_accounts.manage")
  testSmtp(@Body() dto: SmtpAccountDto) {
    return this.emailAccounts.testSmtp(dto);
  }

  @Post("admin/email-accounts/smtp")
  @RequirePermissions("email_accounts.manage")
  createSmtp(@Body() dto: SmtpAccountDto, @Req() request: Request) {
    return this.emailAccounts.createSmtp(dto, actor(request));
  }

  @Patch("admin/email-accounts/:id")
  @RequirePermissions("email_accounts.manage")
  update(@Param() params: IdParamDto, @Body() dto: UpdateEmailAccountDto, @Req() request: Request) {
    return this.emailAccounts.update(params.id, dto, actor(request));
  }

  @Post("admin/email-accounts/:id/reconnect")
  @RequirePermissions("email_accounts.manage")
  reconnect(@Param() params: IdParamDto, @Req() request: Request) {
    return this.emailAccounts.reconnect(params.id, actor(request));
  }

  @Post("admin/email-accounts/:id/disable")
  @RequirePermissions("email_accounts.manage")
  disable(@Param() params: IdParamDto, @Req() request: Request) {
    return this.emailAccounts.disable(params.id, actor(request));
  }

  @Delete("admin/email-accounts/:id")
  @RequirePermissions("email_accounts.manage")
  remove(@Param() params: IdParamDto, @Req() request: Request) {
    return this.emailAccounts.remove(params.id, actor(request));
  }
}
