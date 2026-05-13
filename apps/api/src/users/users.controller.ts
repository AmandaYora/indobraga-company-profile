import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { RequirePermissions } from "@/core/permissions.decorator";
import { NoStore } from "@/core/cache-control.decorator";
import { CreateUserDto } from "@/users/dto/create-user.dto";
import { ListUsersQueryDto } from "@/users/dto/list-users-query.dto";
import { UpdateUserStatusDto } from "@/users/dto/update-user-status.dto";
import { UpdateUserDto } from "@/users/dto/update-user.dto";
import { UserIdParamDto } from "@/users/dto/user-id-param.dto";
import { UsersService } from "@/users/users.service";

@Controller("admin/users")
@NoStore()
@RequirePermissions("users.manage")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(@Query() query: ListUsersQueryDto, @Req() request: Request) {
    return this.usersService.list(query, request.adminUser);
  }

  @Get(":id")
  detail(@Param() params: UserIdParamDto, @Req() request: Request) {
    return this.usersService.findById(params.id, request.adminUser);
  }

  @Post()
  create(@Body() dto: CreateUserDto, @Req() request: Request) {
    return this.usersService.create(dto, request.adminUser);
  }

  @Patch(":id")
  update(@Param() params: UserIdParamDto, @Body() dto: UpdateUserDto, @Req() request: Request) {
    return this.usersService.update(params.id, dto, request.adminUser);
  }

  @Patch(":id/status")
  updateStatus(
    @Param() params: UserIdParamDto,
    @Body() dto: UpdateUserStatusDto,
    @Req() request: Request,
  ) {
    return this.usersService.updateStatus(params.id, dto, request.adminUser);
  }

  @Delete(":id")
  disable(@Param() params: UserIdParamDto, @Req() request: Request) {
    return this.usersService.disable(params.id, request.adminUser);
  }
}
