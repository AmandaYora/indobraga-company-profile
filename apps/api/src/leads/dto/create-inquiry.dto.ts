import { Transform } from "class-transformer";
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

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
  @Matches(/^[0-9+()\-\s]{7,30}$/)
  @Transform(trimString)
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
