import { Transform, Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class ListMediaQueryDto {
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
  @IsIn(["image", "video", "document"])
  media_type?: "image" | "video" | "document";

  @IsOptional()
  @IsIn([
    "processing",
    "completed",
    "failed",
    "archived",
    "pending_delete",
    "deleted",
    "cleanup_failed",
  ])
  compression_status?:
    | "processing"
    | "completed"
    | "failed"
    | "archived"
    | "pending_delete"
    | "deleted"
    | "cleanup_failed";

  @IsOptional()
  @IsString()
  @Transform(trimString)
  usage?: string;
}
