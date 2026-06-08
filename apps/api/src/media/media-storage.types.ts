export type StoredObject = {
  objectKey: string;
  publicUrl: string;
};

export type PutObjectOptions = {
  cacheControl?: string;
  contentType?: string;
};

export interface MediaStorageService {
  delete(objectKey: string): Promise<void>;
  put(objectKey: string, buffer: Buffer, options?: PutObjectOptions): Promise<StoredObject>;
  /** Lightweight readiness probe (bucket reachable / local root writable). */
  ping(): Promise<void>;
}

export const MEDIA_STORAGE = Symbol("MEDIA_STORAGE");
