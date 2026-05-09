import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { API_LEAD_STATUSES, ApiLeadStatus } from "@/leads/lead-status.dto";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class UpdateLeadDto {
  @IsOptional()
  @IsIn(API_LEAD_STATUSES)
  status?: ApiLeadStatus;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(trimString)
  internal_note?: string;
}
