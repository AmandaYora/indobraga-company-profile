import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { IsPhoneNumberId } from "@/core/validators";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class CreateWhatsAppLeadDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(trimString)
  name!: string;

  @IsString()
  @MaxLength(30)
  @Transform(trimString)
  @IsPhoneNumberId()
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(700)
  @Transform(trimString)
  message?: string;
}
