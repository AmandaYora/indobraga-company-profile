import { Transform } from "class-transformer";
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class UpdateEmailTemplateDto {
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(190)
  name?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject?: string;

  @IsOptional()
  @IsIn(["text", "html"])
  content_mode?: "text" | "html";

  @IsOptional()
  @Transform(trimString)
  @IsString()
  body_text?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  body_html?: string;
}
