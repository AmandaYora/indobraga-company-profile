import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import {
  API_MARKETING_CONTACT_SOURCES,
  API_MARKETING_CONTACT_STATUSES,
  ApiMarketingContactSource,
  ApiMarketingContactStatus,
} from "@/audience/audience-maps";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class AudienceFilterDto {
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsIn(API_MARKETING_CONTACT_SOURCES)
  source?: ApiMarketingContactSource;

  @IsOptional()
  @IsIn(API_MARKETING_CONTACT_STATUSES)
  status?: ApiMarketingContactStatus;
}
