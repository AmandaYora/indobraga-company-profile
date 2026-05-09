import { Transform } from "class-transformer";
import { IsEmail, IsIn, IsNotEmpty, IsString, MinLength } from "class-validator";
import { API_USER_ROLES, ApiUserRole } from "@/users/dto/user-role-status.dto";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsIn(API_USER_ROLES)
  role!: ApiUserRole;

  @IsString()
  @MinLength(8)
  temporary_password!: string;
}
