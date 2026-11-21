import { Transform } from "class-transformer";
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { IsPhoneNumberId } from "@/core/validators";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class CreateInquiryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(trimString)
  name!: string;

  @IsEmail()
  @MaxLength(190)
  @Transform(trimString)
  email!: string;

  @IsString()
  @MaxLength(30)
  @Transform(trimString)
  @IsPhoneNumberId()
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(190)
  @Transform(trimString)
  company?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  @Transform(trimString)
  message!: string;

  // Honeypot: hidden in the UI, so real users leave it empty. A filled value
  // indicates a bot. Whitelisted here only so validation accepts (not rejects) it.
  @IsOptional()
  @IsString()
  @MaxLength(190)
  @Transform(trimString)
  website?: string;
}
