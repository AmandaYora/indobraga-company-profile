import { Transform, Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import {
  API_USER_ROLES,
  API_USER_STATUSES,
  ApiUserRole,
  ApiUserStatus,
} from "@/users/dto/user-role-status.dto";

export class ListUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  search?: string;

  @IsOptional()
  @IsIn(API_USER_ROLES)
  role?: ApiUserRole;

  @IsOptional()
  @IsIn(API_USER_STATUSES)
  status?: ApiUserStatus;
}
