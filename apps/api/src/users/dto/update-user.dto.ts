import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { API_USER_ROLES, ApiUserRole } from "@/users/dto/user-role-status.dto";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsIn(API_USER_ROLES)
  role?: ApiUserRole;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @Transform(({ value }: { value: unknown }) => (value === "" ? undefined : value))
  new_password?: string;
}
