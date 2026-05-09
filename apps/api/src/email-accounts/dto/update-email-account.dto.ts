import { Transform, Type } from "class-transformer";
import { IsEmail, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import {
  API_EMAIL_ACCOUNT_STATUSES,
  API_SMTP_SECURITY_MODES,
  ApiEmailAccountStatus,
  ApiSmtpSecurity,
} from "@/email-accounts/email-account-maps";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class UpdateEmailAccountDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(190)
  @Transform(trimString)
  email_address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(190)
  @Transform(trimString)
  display_name?: string;

  @IsOptional()
  @IsIn(API_EMAIL_ACCOUNT_STATUSES)
  status?: ApiEmailAccountStatus;

  @IsOptional()
  @IsString()
  @MaxLength(190)
  @Transform(trimString)
  smtp_host?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  smtp_port?: number;

  @IsOptional()
  @IsIn(API_SMTP_SECURITY_MODES)
  smtp_security?: ApiSmtpSecurity;

  @IsOptional()
  @IsString()
  @MaxLength(190)
  @Transform(trimString)
  smtp_username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  smtp_password?: string;
}
