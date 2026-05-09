import { IsOptional, IsString, MaxLength } from "class-validator";

export class GoogleOAuthCallbackQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  code?: string;

  @IsString()
  @MaxLength(4000)
  state!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  error?: string;
}
