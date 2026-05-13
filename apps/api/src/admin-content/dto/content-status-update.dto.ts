import { IsIn } from "class-validator";
import {
  API_PUBLISHABLE_CONTENT_STATUSES,
  ApiPublishableContentStatus,
} from "@/core/content-status.dto";

export class ContentStatusUpdateDto {
  @IsIn(API_PUBLISHABLE_CONTENT_STATUSES)
  status!: ApiPublishableContentStatus;
}
