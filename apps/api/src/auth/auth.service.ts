import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { User, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash, createHmac, randomBytes } from "node:crypto";
import type { Env } from "@/config/env";
import { PrismaService } from "@/database/prisma.service";
import { AuditService } from "@/audit/audit.service";
import { API_ROLE, AuthenticatedAdmin, ROLE_PERMISSIONS } from "@/auth/auth.types";

type LoginContext = {
  userAgent?: string;
  ip?: string;
};

type LoginResult = {
  user: AuthenticatedAdmin;
  sessionToken: string;
  csrfToken: string;
  maxAgeMs: number;
};

type SessionUser = Pick<User, "id" | "name" | "email" | "role" | "status">;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    private readonly audit: AuditService,
  ) {}

  async login(email: string, password: string, context: LoginContext): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw this.invalidCredentials();
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw this.invalidCredentials();
    }

    const sessionToken = randomBytes(32).toString("base64url");
    const csrfToken = randomBytes(32).toString("base64url");
    const maxAgeMs = this.getSessionMaxAgeMs();
    const expiresAt = new Date(Date.now() + maxAgeMs);

    await this.prisma.$transaction([
      this.prisma.adminSession.create({
        data: {
          userId: user.id,
          tokenHash: this.hashSessionToken(sessionToken),
          userAgent: context.userAgent?.slice(0, 500),
          ipHash: context.ip ? this.hashValue(context.ip) : null,
          expiresAt,
        },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ]);
    await this.audit.record({
      actorUserId: user.id,
      action: "auth.login",
      resourceType: "auth",
      resourceId: user.id,
      metadata: {
        user_agent_present: Boolean(context.userAgent),
        ip_hash_present: Boolean(context.ip),
      },
    });

    return {
      user: this.toAuthenticatedAdmin(user),
      sessionToken,
      csrfToken,
      maxAgeMs,
    };
  }

  async validateSessionToken(sessionToken: string | undefined): Promise<AuthenticatedAdmin | null> {
    if (!sessionToken) {
      return null;
    }

    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash: this.hashSessionToken(sessionToken) },
      include: { user: true },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now() ||
      session.user.status !== UserStatus.ACTIVE
    ) {
      return null;
    }

    return this.toAuthenticatedAdmin(session.user);
  }

  async logout(sessionToken: string | undefined): Promise<void> {
    if (!sessionToken) {
      return;
    }

    const tokenHash = this.hashSessionToken(sessionToken);
    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash },
      select: { userId: true },
    });

    await this.prisma.adminSession.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (session) {
      await this.audit.record({
        actorUserId: session.userId,
        action: "auth.logout",
        resourceType: "auth",
        resourceId: session.userId,
      });
    }
  }

  getSessionMaxAgeMs(): number {
    const days = this.config.get("ADMIN_SESSION_TTL_DAYS", { infer: true });
    return days * 24 * 60 * 60 * 1000;
  }

  toAuthenticatedAdmin(user: SessionUser): AuthenticatedAdmin {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: API_ROLE[user.role],
      permissions: ROLE_PERMISSIONS[user.role],
    };
  }

  private hashSessionToken(sessionToken: string): string {
    return createHmac("sha256", this.config.get("SESSION_SECRET", { infer: true }))
      .update(sessionToken)
      .digest("hex");
  }

  private hashValue(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({
      code: "UNAUTHENTICATED",
      message: "Email atau kata sandi belum sesuai.",
    });
  }
}
