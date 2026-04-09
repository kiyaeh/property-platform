import { IsIn, IsInt, IsUrl, Max, Min } from 'class-validator';

const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export { ALLOWED_IMAGE_MIME_TYPES };

export class PropertyImageInputDto {
  @IsUrl()
  url: string;

  @IsIn(ALLOWED_IMAGE_MIME_TYPES)
  mimeType: string;

  @IsInt()
  @Min(1)
  @Max(5_000_000)
  size: number;
}
