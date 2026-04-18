import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService {
  private readonly client: SupabaseClient | null;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      this.client = null;
      return;
    }

    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  async uploadOwnerImage(params: {
    ownerId: string;
    fileBuffer: Buffer;
    mimeType: string;
    originalName: string;
  }): Promise<{ url: string; mimeType: string; size: number }> {
    if (!this.client) {
      throw new BadRequestException(
        'Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
      );
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'property-images';
    const extension = this.getFileExtension(params.originalName, params.mimeType);
    const safeFileName = params.originalName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-');
    const objectPath = `${params.ownerId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}-${safeFileName || `image.${extension}`}`;

    const { error: uploadError } = await this.client.storage
      .from(bucket)
      .upload(objectPath, params.fileBuffer, {
        contentType: params.mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new InternalServerErrorException(
        `Supabase upload failed: ${uploadError.message}`,
      );
    }

    const { data } = this.client.storage.from(bucket).getPublicUrl(objectPath);
    if (!data.publicUrl) {
      throw new InternalServerErrorException('Unable to resolve uploaded image URL');
    }

    return {
      url: data.publicUrl,
      mimeType: params.mimeType,
      size: params.fileBuffer.byteLength,
    };
  }

  private getFileExtension(originalName: string, mimeType: string): string {
    const fromName = originalName.split('.').pop()?.toLowerCase();
    if (fromName) {
      return fromName;
    }

    switch (mimeType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      default:
        return 'bin';
    }
  }
}
