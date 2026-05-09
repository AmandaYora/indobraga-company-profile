import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export type PublicGalleryType = "image" | "video";

export const PUBLIC_GALLERY_TYPES: PublicGalleryType[] = ["image", "video"];

export class GalleryQueryDto {
  @IsOptional()
  @IsIn(PUBLIC_GALLERY_TYPES)
  type?: PublicGalleryType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;
}
