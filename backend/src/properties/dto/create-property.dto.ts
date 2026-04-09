import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PropertyImageInputDto } from './property-image-input.dto';

export class CreatePropertyDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  location: string;

  @IsInt()
  @Min(1)
  @Max(1_000_000_000)
  price: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PropertyImageInputDto)
  images?: PropertyImageInputDto[];
}
