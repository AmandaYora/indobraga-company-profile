import { Transform, Type } from "class-transformer";
import { IsEmail, IsIn, IsInt, IsString, Max, MaxLength, Min } from "class-validator";
import { API_SMTP_SECURITY_MODES, ApiSmtpSecurity } from "@/email-accounts/email-account-maps";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class SmtpAccountDto {
  @IsEmail()
  @MaxLength(190)
  @Transform(trimString)
  email_address!: string;

  @IsString()
  @MaxLength(190)
  @Transform(trimString)
  display_name!: string;

  @IsString()
  @MaxLength(190)
  @Transform(trimString)
  smtp_host!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  smtp_port!: number;

  @IsIn(API_SMTP_SECURITY_MODES)
  smtp_security!: ApiSmtpSecurity;

  @IsString()
  @MaxLength(190)
  @Transform(trimString)
  smtp_username!: string;

  @IsString()
  @MaxLength(1000)
  smtp_password!: string;
}
