import { Transform, Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import {
  API_EMAIL_CAMPAIGN_STATUSES,
  ApiEmailCampaignStatus,
} from "@/email-campaigns/email-campaign-maps";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class ListCampaignsQueryDto {
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
  @Transform(trimString)
  q?: string;

  @IsOptional()
  @IsIn(API_EMAIL_CAMPAIGN_STATUSES)
  status?: ApiEmailCampaignStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  email_account_id?: number;
}
