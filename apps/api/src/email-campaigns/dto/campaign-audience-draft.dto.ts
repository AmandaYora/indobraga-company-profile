import { Transform, Type } from "class-transformer";
import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { AudienceFilterDto } from "@/audience/dto/audience-filter.dto";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class CampaignAudienceDraftDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(190)
  title!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  email_account_id!: number;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject!: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  body_text?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  body_html?: string;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => AudienceFilterDto)
  audience_filter!: AudienceFilterDto;
}
