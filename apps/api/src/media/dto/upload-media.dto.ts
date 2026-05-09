import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString } from "class-validator";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class UploadMediaDto {
  @IsIn(["hero", "partner", "portfolio", "machine", "gallery", "news", "og", "other"])
  usage!: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  alt_text?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  caption?: string;
}
