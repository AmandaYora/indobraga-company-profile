import { Transform } from "class-transformer";
import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class CreateWhatsAppLeadDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(trimString)
  name!: string;

  @IsString()
  @Matches(/^[0-9+()\-\s]{7,30}$/)
  @Transform(trimString)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(700)
  @Transform(trimString)
  message?: string;
}
