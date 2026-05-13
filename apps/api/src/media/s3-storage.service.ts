import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ConfigService } from "@nestjs/config";
import type { Env } from "@/config/env";
import { normalizeObjectKey, publicObjectUrl } from "@/media/media-storage-url";
import type {
  MediaStorageService,
  PutObjectOptions,
  StoredObject,
} from "@/media/media-storage.types";

export class S3StorageService implements MediaStorageService {
  private readonly bucket: string;
  private readonly client: S3Client;

  constructor(private readonly config: ConfigService<Env, true>) {
    const endpoint = this.required("S3_ENDPOINT", this.config.get("S3_ENDPOINT", { infer: true }));
    const accessKeyId = this.required(
      "S3_ACCESS_KEY_ID",
      this.config.get("S3_ACCESS_KEY_ID", { infer: true }),
    );
    const secretAccessKey = this.required(
      "S3_SECRET_ACCESS_KEY",
      this.config.get("S3_SECRET_ACCESS_KEY", { infer: true }),
    );

    this.bucket = this.required("S3_BUCKET", this.config.get("S3_BUCKET", { infer: true }));
    this.client = new S3Client({
      endpoint,
      region: this.config.get("S3_REGION", { infer: true }),
      forcePathStyle: this.config.get("S3_FORCE_PATH_STYLE", { infer: true }),
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async delete(objectKey: string): Promise<void> {
    const normalizedKey = normalizeObjectKey(objectKey);

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: normalizedKey,
      }),
    );
  }

  async put(
    objectKey: string,
    buffer: Buffer,
    options: PutObjectOptions = {},
  ): Promise<StoredObject> {
    const normalizedKey = normalizeObjectKey(objectKey);

    await this.client.send(
      new PutObjectCommand({
        ACL: "public-read",
        Bucket: this.bucket,
        Key: normalizedKey,
        Body: buffer,
        CacheControl: options.cacheControl ?? "public, max-age=31536000, immutable",
        ContentLength: buffer.byteLength,
        ContentType: options.contentType,
      }),
    );

    return {
      objectKey: normalizedKey,
      publicUrl: publicObjectUrl(
        this.config.get("PUBLIC_MEDIA_URL", { infer: true }),
        normalizedKey,
      ),
    };
  }

  private required(name: string, value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error(`${name} wajib diisi ketika STORAGE_DRIVER=s3.`);
    }

    return trimmed;
  }
}
