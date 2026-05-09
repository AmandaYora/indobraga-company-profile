import { Transform, Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { API_CONTENT_STATUSES, ApiContentStatus } from "@/core/content-status.dto";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class AdminListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  q?: string;

  @IsOptional()
  @IsIn(API_CONTENT_STATUSES)
  status?: ApiContentStatus;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  category?: string;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  segment?: string;

  @IsOptional()
  @IsIn(["image", "video"])
  type?: "image" | "video";
}
