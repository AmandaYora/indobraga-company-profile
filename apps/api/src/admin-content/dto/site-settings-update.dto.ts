import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, Min } from "class-validator";
import {
  normalizeInstagramHandle,
  normalizePhoneNumber,
} from "@/core/phone";
import { IsInstagramHandle, IsPhoneNumberId } from "@/core/validators";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

// Local numbers ("0852...") are converted to the international form ("62852...")
// so wa.me links never point to the wrong country (QA IB-01). Invalid input is
// left untouched so the validator below can report it.
const normalizeWhatsapp = ({ value }: { value: unknown }) =>
  typeof value === "string" ? (normalizePhoneNumber(value) ?? value.trim()) : value;

const normalizeInstagram = ({ value }: { value: unknown }) =>
  typeof value === "string" ? normalizeInstagramHandle(value) : value;

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
  @Transform(normalizeWhatsapp)
  @IsPhoneNumberId({
    message: "Nomor WhatsApp belum valid. Gunakan format seperti 0852xxxxxxxx atau 62852xxxxxxxx.",
  })
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @Transform(normalizeInstagram)
  @IsInstagramHandle()
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
  @IsBoolean()
  show_brand_text?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  logo_media_file_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  footer_logo_media_file_id?: number;

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
