import { IsInt, IsString, IsUrl, Max, Min } from 'class-validator';

export class PropertyImageInputDto {
  @IsUrl()
  url: string;

  @IsString()
  mimeType: string;

  @IsInt()
  @Min(1)
  @Max(10_000_000)
  size: number;
}
