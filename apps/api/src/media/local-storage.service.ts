import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Env } from "@/config/env";
import { normalizeObjectKey, publicObjectUrl } from "@/media/media-storage-url";
import type {
  MediaStorageService,
  PutObjectOptions,
  StoredObject,
} from "@/media/media-storage.types";

@Injectable()
export class LocalStorageService implements MediaStorageService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  async ping(): Promise<void> {
    const root = this.config.get("STORAGE_LOCAL_ROOT", { infer: true });
    // Ensures the storage root exists and is writable.
    await mkdir(join(process.cwd(), root), { recursive: true });
  }

  async delete(objectKey: string): Promise<void> {
    const root = this.config.get("STORAGE_LOCAL_ROOT", { infer: true });
    const normalizedKey = normalizeObjectKey(objectKey);
    const filepath = join(process.cwd(), root, normalizedKey);

    await rm(filepath, { force: true });
  }

  async put(
    objectKey: string,
    buffer: Buffer,
    _options: PutObjectOptions = {},
  ): Promise<StoredObject> {
    const root = this.config.get("STORAGE_LOCAL_ROOT", { infer: true });
    const normalizedKey = normalizeObjectKey(objectKey);
    const filepath = join(process.cwd(), root, normalizedKey);

    await mkdir(dirname(filepath), { recursive: true });
    await writeFile(filepath, buffer);

    return {
      objectKey: normalizedKey,
      publicUrl: publicObjectUrl(
        this.config.get("PUBLIC_MEDIA_URL", { infer: true }),
        normalizedKey,
      ),
    };
  }
}
