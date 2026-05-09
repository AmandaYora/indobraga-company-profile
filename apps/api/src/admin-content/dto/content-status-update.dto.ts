import { IsIn } from "class-validator";
import { API_CONTENT_STATUSES, ApiContentStatus } from "@/core/content-status.dto";

export class ContentStatusUpdateDto {
  @IsIn(API_CONTENT_STATUSES)
  status!: ApiContentStatus;
}
