import { IsString, MaxLength } from "class-validator";

export class SeoRouteParamDto {
  @IsString()
  @MaxLength(190)
  route!: string;
}
