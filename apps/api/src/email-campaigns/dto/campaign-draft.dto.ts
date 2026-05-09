import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { EmailRecipientDto } from "@/email-campaigns/dto/email-recipient.dto";

export class CampaignDraftDto {
  @IsString()
  @MaxLength(190)
  title!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  email_account_id!: number;

  @IsString()
  @MaxLength(255)
  subject!: string;

  @IsOptional()
  @IsString()
  body_text?: string;

  @IsString()
  body_html!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  recipients!: EmailRecipientDto[];
}
