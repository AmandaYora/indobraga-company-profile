import { ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma, User, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { UsersService } from "@/users/users.service";

const user = (overrides: Partial<User> = {}): User => ({
  id: 1,
  name: "Admin",
  email: "admin@indobraga.com",
  passwordHash: "hash",
  role: UserRole.SUPER_ADMIN,
  status: UserStatus.ACTIVE,
  lastLoginAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const prismaMock = () => ({
  user: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  adminSession: {
    updateMany: jest.fn(),
  },
  $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
});

describe("UsersService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("lists safe users with pagination metadata and filters", async () => {
    const prisma = prismaMock();
    prisma.user.findMany.mockResolvedValue([user()]);
    prisma.user.count.mockResolvedValue(1);
    const service = new UsersService(prisma as never);

    await expect(
      service.list({
        page: 1,
        limit: 10,
        search: "admin",
        role: "super_admin",
        status: "active",
      }),
    ).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: 1,
          name: "Admin",
          email: "admin@indobraga.com",
          role: "super_admin",
          status: "active",
        }),
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1,
      },
    });
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ name: { contains: "admin" } }, { email: { contains: "admin" } }],
          role: UserRole.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
        },
      }),
    );
  });

  it("throws not found when user id does not exist", async () => {
    const prisma = prismaMock();
    prisma.user.findUnique.mockResolvedValue(null);
    const service = new UsersService(prisma as never);

    await expect(service.findById(404)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("creates user with hashed temporary password", async () => {
    jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed-password" as never);
    const prisma = prismaMock();
    prisma.user.create.mockResolvedValue(
      user({
        name: "Editor",
        email: "editor@indobraga.com",
        passwordHash: "hashed-password",
        role: UserRole.CONTENT_EDITOR,
      }),
    );
    const service = new UsersService(prisma as never);

    await expect(
      service.create({
        name: "Editor",
        email: "editor@indobraga.com",
        role: "content_editor",
        temporary_password: "TempPassword123!",
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        email: "editor@indobraga.com",
        role: "content_editor",
      }),
    );
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: "Editor",
        email: "editor@indobraga.com",
        passwordHash: "hashed-password",
        role: UserRole.CONTENT_EDITOR,
        status: UserStatus.ACTIVE,
      },
    });
  });

  it("maps unique email write errors to conflict response", async () => {
    const prisma = prismaMock();
    prisma.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique failed", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    const service = new UsersService(prisma as never);

    await expect(
      service.create({
        name: "Admin",
        email: "admin@indobraga.com",
        role: "super_admin",
        temporary_password: "TempPassword123!",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("revokes sessions when user is disabled", async () => {
    const prisma = prismaMock();
    prisma.user.update.mockResolvedValue(user({ status: UserStatus.INACTIVE }));
    prisma.adminSession.updateMany.mockResolvedValue({ count: 2 });
    const service = new UsersService(prisma as never);

    await expect(service.updateStatus(1, { status: "inactive" })).resolves.toEqual(
      expect.objectContaining({ status: "inactive" }),
    );
    expect(prisma.adminSession.updateMany).toHaveBeenCalledTimes(1);
    const [call] = prisma.adminSession.updateMany.mock.calls[0] as [
      { where: { userId: number; revokedAt: null }; data: { revokedAt: Date } },
    ];
    expect(call.where).toEqual({ userId: 1, revokedAt: null });
    expect(call.data.revokedAt).toBeInstanceOf(Date);
  });
});
