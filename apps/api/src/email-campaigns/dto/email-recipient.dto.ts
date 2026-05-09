import { Transform } from "class-transformer";
import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class EmailRecipientDto {
  @IsOptional()
  @IsString()
  @MaxLength(190)
  @Transform(trimString)
  name?: string;

  @IsEmail()
  @MaxLength(190)
  @Transform(trimString)
  email!: string;
}
