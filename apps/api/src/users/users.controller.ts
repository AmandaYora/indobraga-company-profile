import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
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
  list(@Query() query: ListUsersQueryDto) {
    return this.usersService.list(query);
  }

  @Get(":id")
  detail(@Param() params: UserIdParamDto) {
    return this.usersService.findById(params.id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(":id")
  update(@Param() params: UserIdParamDto, @Body() dto: UpdateUserDto) {
    return this.usersService.update(params.id, dto);
  }

  @Patch(":id/status")
  updateStatus(@Param() params: UserIdParamDto, @Body() dto: UpdateUserStatusDto) {
    return this.usersService.updateStatus(params.id, dto);
  }

  @Delete(":id")
  disable(@Param() params: UserIdParamDto) {
    return this.usersService.disable(params.id);
  }
}
