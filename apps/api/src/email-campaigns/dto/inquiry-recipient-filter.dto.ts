import { Transform } from "class-transformer";
import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { API_LEAD_STATUSES, ApiLeadStatus } from "@/leads/lead-status.dto";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class InquiryRecipientFilterDto {
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsIn(API_LEAD_STATUSES)
  status?: ApiLeadStatus;

  @IsOptional()
  @Transform(trimString)
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @Transform(trimString)
  @IsDateString()
  date_to?: string;
}
