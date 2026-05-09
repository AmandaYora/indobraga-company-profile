import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt, ValidateNested } from "class-validator";

export class ReorderItemDto {
  @Type(() => Number)
  @IsInt()
  id!: number;

  @Type(() => Number)
  @IsInt()
  sort_order!: number;
}

export class ReorderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}
