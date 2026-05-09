import { validateEnv } from "@/config/env";

describe("validateEnv", () => {
  it("rejects development defaults in production", () => {
    expect(() =>
      validateEnv({
        NODE_ENV: "production",
        DATABASE_URL: "mysql://user:pass@localhost:3306/db",
        SESSION_SECRET: "development-session-secret-change-me",
        CREDENTIAL_ENCRYPTION_KEY: "development-credential-secret-change-me",
        INTERNAL_WORKER_SECRET: "development-worker-secret",
        CORS_ORIGINS: "",
        STORAGE_DRIVER: "local",
      }),
    ).toThrow("Invalid environment configuration");
  });

  it("accepts explicit production secrets", () => {
    const env = validateEnv({
      NODE_ENV: "production",
      DATABASE_URL: "mysql://user:pass@localhost:3306/db",
      SESSION_SECRET: "prod-session-secret-with-more-than-32-characters",
      CREDENTIAL_ENCRYPTION_KEY: "prod-credential-secret-with-more-than-32-characters",
      INTERNAL_WORKER_SECRET: "prod-worker-secret-with-more-than-32-characters",
      CORS_ORIGINS: "https://indobraga.com",
      STORAGE_DRIVER: "s3",
      MEDIA_STORAGE_ENV: "prod",
      S3_ENDPOINT: "https://object-storage.example.com",
      S3_BUCKET: "indobraga-media",
      S3_ACCESS_KEY_ID: "prod-access-key",
      S3_SECRET_ACCESS_KEY: "prod-secret-key",
    });

    expect(env.NODE_ENV).toBe("production");
    expect(env.STORAGE_DRIVER).toBe("s3");
  });

  it("rejects s3 mode without complete object storage config", () => {
    expect(() =>
      validateEnv({
        NODE_ENV: "development",
        STORAGE_DRIVER: "s3",
        S3_ACCESS_KEY_ID: "dev-access-key",
        S3_SECRET_ACCESS_KEY: "dev-secret-key",
      }),
    ).toThrow("Invalid environment configuration");
  });
});
