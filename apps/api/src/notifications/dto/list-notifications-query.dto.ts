import { Transform, Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export const API_NOTIFICATION_READ_FILTERS = ["all", "unread"] as const;

export type ApiNotificationReadFilter = (typeof API_NOTIFICATION_READ_FILTERS)[number];

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class ListNotificationsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @IsIn(API_NOTIFICATION_READ_FILTERS)
  read?: ApiNotificationReadFilter;

  @IsOptional()
  @IsString()
  @Transform(trimString)
  q?: string;
}
