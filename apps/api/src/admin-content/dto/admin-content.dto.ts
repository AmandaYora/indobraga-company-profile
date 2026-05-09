import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from "class-validator";
import { API_CONTENT_STATUSES, ApiContentStatus } from "@/core/content-status.dto";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class AdminContentDto {
  @IsOptional()
  @IsString()
  @Transform(trimString)
  title?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  name?: string;

  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  cta_label?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  cta_href?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  label?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  metric?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  value?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  suffix?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  segment?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  category?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  short_description?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  description?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  alt_text?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  caption?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  excerpt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  content?: string[];

  @IsOptional()
  @IsString()
  @Transform(trimString)
  product?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hero_section_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  media_file_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  logo_media_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  poster_media_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  thumbnail_media_file_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  og_image_media_file_id?: number;

  @IsOptional()
  @IsIn(["image", "video"])
  media_type?: "image" | "video";

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === true || value === "true")
  is_featured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  sort_order?: number;

  @IsOptional()
  @IsIn(API_CONTENT_STATUSES)
  status?: ApiContentStatus;

  @IsOptional()
  @IsISO8601()
  published_at?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  seo_title?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  seo_description?: string;
}
