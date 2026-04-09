import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PropertyStatus } from '@prisma/client';

export class ListPropertiesQueryDto {
  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

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
}
