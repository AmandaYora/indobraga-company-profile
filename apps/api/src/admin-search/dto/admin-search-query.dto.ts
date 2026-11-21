import { Transform } from "class-transformer";
import { IsString, MaxLength, MinLength } from "class-validator";

export class AdminSearchQueryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  q!: string;
}
