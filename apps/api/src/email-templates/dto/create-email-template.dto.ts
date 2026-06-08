import { Transform } from "class-transformer";
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class CreateEmailTemplateDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(190)
  name!: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject!: string;

  @IsIn(["text", "html"])
  content_mode!: "text" | "html";

  @IsOptional()
  @Transform(trimString)
  @IsString()
  body_text?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  body_html?: string;
}
