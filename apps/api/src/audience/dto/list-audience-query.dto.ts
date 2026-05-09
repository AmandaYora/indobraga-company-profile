import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";
import { AudienceFilterDto } from "@/audience/dto/audience-filter.dto";

export class ListAudienceQueryDto extends AudienceFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
