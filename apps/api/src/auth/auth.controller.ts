import { Body, Controller, Get, HttpCode, Post, Req, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import type { Env } from "@/config/env";
import { NoStore } from "@/core/cache-control.decorator";
import { PublicRoute, RequireAuth, SkipCsrf } from "@/auth/auth.decorators";
import { AuthService } from "@/auth/auth.service";
import { clearCookie, getCookieValue, setCsrfCookie, setSessionCookie } from "@/auth/cookie.utils";
import { LoginDto } from "@/auth/dto/login.dto";

@Controller("auth")
@NoStore()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post("login")
  @HttpCode(200)
  @PublicRoute()
  @SkipCsrf()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto.email, dto.password, {
      userAgent: request.get("user-agent"),
      ip: request.ip,
    });

    this.setAuthCookies(response, result.sessionToken, result.csrfToken, result.maxAgeMs);

    return {
      user: result.user,
    };
  }

  @Post("logout")
  @HttpCode(200)
  @RequireAuth()
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const sessionCookieName = this.config.get("SESSION_COOKIE_NAME", { infer: true });
    const sessionToken = getCookieValue(request, sessionCookieName);

    await this.authService.logout(sessionToken);
    this.clearAuthCookies(response);

    return {
      status: "logged_out",
    };
  }

  @Get("me")
  @RequireAuth()
  me(@Req() request: Request) {
    return {
      user: request.adminUser,
    };
  }

  private setAuthCookies(
    response: Response,
    sessionToken: string,
    csrfToken: string,
    maxAgeMs: number,
  ): void {
    const isProduction = this.config.get("NODE_ENV", { infer: true }) === "production";

    setSessionCookie(
      response,
      this.config.get("SESSION_COOKIE_NAME", { infer: true }),
      sessionToken,
      isProduction,
      maxAgeMs,
    );
    setCsrfCookie(
      response,
      this.config.get("CSRF_COOKIE_NAME", { infer: true }),
      csrfToken,
      isProduction,
      maxAgeMs,
    );
  }

  private clearAuthCookies(response: Response): void {
    const isProduction = this.config.get("NODE_ENV", { infer: true }) === "production";

    clearCookie(response, this.config.get("SESSION_COOKIE_NAME", { infer: true }), isProduction);
    clearCookie(response, this.config.get("CSRF_COOKIE_NAME", { infer: true }), isProduction);
  }
}
