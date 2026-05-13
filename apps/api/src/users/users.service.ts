import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, User, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AuthenticatedAdmin, ROLE_PERMISSIONS } from "@/auth/auth.types";
import { createPagePaginationMeta, normalizePagePagination } from "@/core/pagination";
import { PrismaService } from "@/database/prisma.service";
import { CreateUserDto } from "@/users/dto/create-user.dto";
import { ListUsersQueryDto } from "@/users/dto/list-users-query.dto";
import { UpdateUserStatusDto } from "@/users/dto/update-user-status.dto";
import { UpdateUserDto } from "@/users/dto/update-user.dto";
import {
  API_TO_PRISMA_ROLE,
  API_TO_PRISMA_STATUS,
  PRISMA_TO_API_STATUS,
} from "@/users/dto/user-role-status.dto";

type SafeAdminUser = {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "content_editor";
  status: "active" | "inactive";
  permissions: string[];
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type UserVisibilityContext = Pick<AuthenticatedAdmin, "role"> &
  Partial<Pick<AuthenticatedAdmin, "id">>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListUsersQueryDto, viewer?: UserVisibilityContext) {
    const pagination = normalizePagePagination({
      page: query.page,
      limit: query.limit,
      defaultLimit: 10,
      maxLimit: 100,
    });
    const where = this.buildWhere(query, viewer);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((user) => this.toSafeUser(user)),
      pagination: createPagePaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async findById(id: number, viewer?: UserVisibilityContext): Promise<SafeAdminUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user || !this.canViewUser(user, viewer)) {
      throw this.notFound();
    }

    return this.toSafeUser(user);
  }

  async create(dto: CreateUserDto, viewer?: UserVisibilityContext): Promise<SafeAdminUser> {
    this.assertCanAssignRole(dto.role, viewer);

    try {
      const passwordHash = await bcrypt.hash(dto.temporary_password, 12);
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
          role: API_TO_PRISMA_ROLE[dto.role],
          status: UserStatus.ACTIVE,
        },
      });

      return this.toSafeUser(user);
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    viewer?: UserVisibilityContext,
  ): Promise<SafeAdminUser> {
    this.assertCanAssignRole(dto.role, viewer);
    await this.assertCanManageExistingUser(id, viewer);

    try {
      const passwordHash = dto.new_password ? await bcrypt.hash(dto.new_password, 12) : undefined;
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          name: dto.name,
          role: dto.role ? API_TO_PRISMA_ROLE[dto.role] : undefined,
          passwordHash,
        },
      });

      if (passwordHash && viewer?.id !== id) {
        await this.revokeUserSessions(id);
      }

      return this.toSafeUser(user);
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  async updateStatus(
    id: number,
    dto: UpdateUserStatusDto,
    viewer?: UserVisibilityContext,
  ): Promise<SafeAdminUser> {
    await this.assertCanManageExistingUser(id, viewer);

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          status: API_TO_PRISMA_STATUS[dto.status],
        },
      });

      if (user.status === UserStatus.INACTIVE) {
        await this.revokeUserSessions(id);
      }

      return this.toSafeUser(user);
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  async disable(
    id: number,
    viewer?: UserVisibilityContext,
  ): Promise<{ id: number; status: "disabled" }> {
    await this.assertCanManageExistingUser(id, viewer);

    try {
      await this.prisma.user.update({
        where: { id },
        data: {
          status: UserStatus.INACTIVE,
        },
      });
      await this.revokeUserSessions(id);

      return { id, status: "disabled" };
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  private buildWhere(
    query: ListUsersQueryDto,
    viewer?: UserVisibilityContext,
  ): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (query.search) {
      where.OR = [{ name: { contains: query.search } }, { email: { contains: query.search } }];
    }

    if (query.role) {
      where.role = API_TO_PRISMA_ROLE[query.role];
    }

    if (query.status) {
      where.status = API_TO_PRISMA_STATUS[query.status];
    }

    if (viewer?.role === "content_editor") {
      const visibleUserFilter: Prisma.UserWhereInput = { role: { not: UserRole.SUPER_ADMIN } };
      return Object.keys(where).length > 0
        ? { AND: [where, visibleUserFilter] }
        : visibleUserFilter;
    }

    return where;
  }

  private toSafeUser(user: User): SafeAdminUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === UserRole.SUPER_ADMIN ? "super_admin" : "content_editor",
      status: PRISMA_TO_API_STATUS[user.status],
      permissions: ROLE_PERMISSIONS[user.role],
      last_login_at: user.lastLoginAt,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };
  }

  private async revokeUserSessions(userId: number): Promise<void> {
    await this.prisma.adminSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private canViewUser(user: User, viewer?: UserVisibilityContext): boolean {
    return !(viewer?.role === "content_editor" && user.role === UserRole.SUPER_ADMIN);
  }

  private async assertCanManageExistingUser(
    id: number,
    viewer?: UserVisibilityContext,
  ): Promise<void> {
    if (viewer?.role !== "content_editor") {
      return;
    }

    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user || !this.canViewUser(user, viewer)) {
      throw this.notFound();
    }
  }

  private assertCanAssignRole(
    role?: "super_admin" | "content_editor",
    viewer?: UserVisibilityContext,
  ): void {
    if (viewer?.role === "content_editor" && role === "super_admin") {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Editor Konten hanya dapat mengelola pengguna dengan akses Editor Konten.",
      });
    }
  }

  private handlePrismaWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new ConflictException({
          code: "CONFLICT",
          message: "Email sudah digunakan.",
        });
      }

      if (error.code === "P2025") {
        throw this.notFound();
      }
    }

    throw error;
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      code: "NOT_FOUND",
      message: "Pengguna tidak ditemukan.",
    });
  }
}
