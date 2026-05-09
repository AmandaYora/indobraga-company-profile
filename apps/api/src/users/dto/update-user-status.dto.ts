import { IsIn } from "class-validator";
import { API_USER_STATUSES, ApiUserStatus } from "@/users/dto/user-role-status.dto";

export class UpdateUserStatusDto {
  @IsIn(API_USER_STATUSES)
  status!: ApiUserStatus;
}
