import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { ConfigService } from "@nestjs/config";
import type { Env } from "@/config/env";
import { S3StorageService } from "@/media/s3-storage.service";

const mockSend = jest.fn();

jest.mock("@aws-sdk/client-s3", () => ({
  DeleteObjectCommand: jest.fn((input) => ({ input, type: "delete" })),
  PutObjectCommand: jest.fn((input) => ({ input, type: "put" })),
  S3Client: jest.fn(() => ({ send: mockSend })),
}));

function config(overrides: Partial<Record<keyof Env, string | boolean>> = {}) {
  const values: Partial<Record<keyof Env, string | boolean>> = {
    PUBLIC_MEDIA_URL: "https://cdn.example.com/media/",
    S3_ACCESS_KEY_ID: "access-key",
    S3_BUCKET: "indobraga",
    S3_ENDPOINT: "https://s3.example.com",
    S3_FORCE_PATH_STYLE: true,
    S3_REGION: "auto",
    S3_SECRET_ACCESS_KEY: "secret-key",
    ...overrides,
  };

  return {
    get: jest.fn((key: keyof Env) => values[key]),
  } as unknown as ConfigService<Env, true>;
}

describe("S3StorageService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue(undefined);
  });

  it("creates an S3 client with required storage settings", () => {
    new S3StorageService(config());

    expect(S3Client).toHaveBeenCalledWith({
      credentials: {
        accessKeyId: "access-key",
        secretAccessKey: "secret-key",
      },
      endpoint: "https://s3.example.com",
      forcePathStyle: true,
      region: "auto",
    });
  });

  it("uploads normalized objects and returns their public URL", async () => {
    const service = new S3StorageService(config());

    await expect(
      service.put("\\upload\\prod\\foto utama.webp", Buffer.from("abc"), {
        contentType: "image/webp",
      }),
    ).resolves.toEqual({
      objectKey: "upload/prod/foto utama.webp",
      publicUrl: "https://cdn.example.com/media/upload/prod/foto%20utama.webp",
    });

    expect(PutObjectCommand).toHaveBeenCalledWith({
      Body: Buffer.from("abc"),
      Bucket: "indobraga",
      CacheControl: "public, max-age=31536000, immutable",
      ContentLength: 3,
      ContentType: "image/webp",
      Key: "upload/prod/foto utama.webp",
    });
    expect(mockSend).toHaveBeenCalledWith({ input: expect.any(Object), type: "put" });
  });

  it("honors explicit cache control and deletes by object key", async () => {
    const service = new S3StorageService(config());

    await service.put("upload/prod/file.webp", Buffer.from("x"), {
      cacheControl: "no-store",
    });
    await service.delete("/upload/prod/file.webp");

    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({ CacheControl: "no-store" }),
    );
    expect(DeleteObjectCommand).toHaveBeenCalledWith({
      Bucket: "indobraga",
      Key: "upload/prod/file.webp",
    });
  });

  it("rejects incomplete S3 configuration with a clear setup error", () => {
    expect(() => new S3StorageService(config({ S3_BUCKET: " " }))).toThrow(
      "S3_BUCKET wajib diisi ketika STORAGE_DRIVER=s3.",
    );
  });
});
