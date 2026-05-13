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
}

export const MEDIA_STORAGE = Symbol("MEDIA_STORAGE");
