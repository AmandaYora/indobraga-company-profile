import { Transform, Type } from "class-transformer";
import { IsEmail, IsInt, IsOptional, IsString, Min } from "class-validator";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class SiteSettingsUpdateDto {
  @IsOptional()
  @IsString()
  @Transform(trimString)
  brand?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  legal_name?: string;

  @IsOptional()
  @IsEmail()
  @Transform(trimString)
  email?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  phone?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  instagram?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  contact_person?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  contact_role?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  address?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  seo_title?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  seo_description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  logo_media_file_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  og_media_file_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  contact_hero_media_file_id?: number;
}
