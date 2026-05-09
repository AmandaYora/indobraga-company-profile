import { Transform } from "class-transformer";
import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class GoogleOAuthUrlDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(190)
  @Transform(trimString)
  email_hint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(190)
  @Transform(trimString)
  display_name?: string;
}
