import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { User, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Env } from "@/config/env";
import { AuthService } from "@/auth/auth.service";
import type { AuditService } from "@/audit/audit.service";

const config = (): ConfigService<Env, true> =>
  ({
    get: jest.fn((key: string) => {
      if (key === "ADMIN_SESSION_TTL_DAYS") {
        return 7;
      }
      if (key === "SESSION_SECRET") {
        return "test-session-secret";
      }
      return undefined;
    }),
  }) as unknown as ConfigService<Env, true>;

const user = (overrides: Partial<User> = {}): User => ({
  id: 1,
  name: "Admin",
  email: "admin@indobraga.com",
  passwordHash: "hashed-password",
  role: UserRole.SUPER_ADMIN,
  status: UserStatus.ACTIVE,
  lastLoginAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const prismaMock = () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn().mockResolvedValue(user()),
  },
  adminSession: {
    create: jest.fn().mockResolvedValue({ id: 1 }),
    findUnique: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
});

describe("AuthService", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("rejects login when user is missing or inactive", async () => {
    const prisma = prismaMock();
    prisma.user.findUnique.mockResolvedValue(null);
    const service = new AuthService(prisma as never, config(), {
      record: jest.fn(),
    } as unknown as AuditService);

    await expect(service.login("ADMIN@INDOBRAGA.COM", "secret", {})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("creates admin session and audit entry on successful login", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    jest.spyOn(bcrypt, "compare").mockResolvedValue(true as never);
    const prisma = prismaMock();
    prisma.user.findUnique.mockResolvedValue(user());
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const service = new AuthService(prisma as never, config(), audit as unknown as AuditService);

    const result = await service.login(" ADMIN@INDOBRAGA.COM ", "secret", {
      userAgent: "Mozilla/5.0",
      ip: "127.0.0.1",
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "admin@indobraga.com" },
    });
    expect(prisma.adminSession.create).toHaveBeenCalledTimes(1);
    const [sessionCreateArg] = prisma.adminSession.create.mock.calls[0] as [
      { data: { userId: number; userAgent?: string; ipHash: string | null; expiresAt: Date } },
    ];
    expect(sessionCreateArg.data.userId).toBe(1);
    expect(sessionCreateArg.data.userAgent).toBe("Mozilla/5.0");
    expect(sessionCreateArg.data.ipHash).toEqual(expect.any(String) as string);
    expect(sessionCreateArg.data.expiresAt).toEqual(new Date("2026-01-08T00:00:00.000Z"));
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 1,
        action: "auth.login",
        metadata: { user_agent_present: true, ip_hash_present: true },
      }),
    );
    expect(result.user).toEqual(
      expect.objectContaining({
        id: 1,
        email: "admin@indobraga.com",
        role: "super_admin",
      }),
    );
    expect(result.sessionToken).toEqual(expect.any(String) as string);
    expect(result.csrfToken).toEqual(expect.any(String) as string);
    expect(result.maxAgeMs).toBe(604800000);
  });

  it("validates active, unexpired session token", async () => {
    const prisma = prismaMock();
    prisma.adminSession.findUnique.mockResolvedValue({
      revokedAt: null,
      expiresAt: new Date(Date.now() + 10000),
      user: user({ role: UserRole.CONTENT_EDITOR }),
    });
    const service = new AuthService(prisma as never, config(), {
      record: jest.fn(),
    } as unknown as AuditService);

    await expect(service.validateSessionToken("token")).resolves.toEqual(
      expect.objectContaining({
        id: 1,
        role: "content_editor",
        permissions: expect.arrayContaining([
          "users.manage",
          "site_settings.manage",
          "email_accounts.manage",
          "seo.manage",
        ]),
      }),
    );
    await expect(service.validateSessionToken(undefined)).resolves.toBeNull();
  });

  it("revokes session and audits logout when token exists", async () => {
    const prisma = prismaMock();
    prisma.adminSession.findUnique.mockResolvedValue({ userId: 1 });
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const service = new AuthService(prisma as never, config(), audit as unknown as AuditService);

    await service.logout("token");

    expect(prisma.adminSession.updateMany).toHaveBeenCalledTimes(1);
    const [sessionUpdateArg] = prisma.adminSession.updateMany.mock.calls[0] as [
      { where: { tokenHash: string; revokedAt: null }; data: { revokedAt: Date } },
    ];
    expect(sessionUpdateArg.where.tokenHash).toEqual(expect.any(String) as string);
    expect(sessionUpdateArg.where.revokedAt).toBeNull();
    expect(sessionUpdateArg.data.revokedAt).toBeInstanceOf(Date);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 1,
        action: "auth.logout",
      }),
    );
  });
});
