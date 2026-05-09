import { z } from "zod";

const booleanEnv = z
  .preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
    z.enum(["true", "false"]),
  )
  .default("true")
  .transform((value) => value === "true");

const objectPathSegment = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Gunakan huruf kecil, angka, dan tanda hubung.");

type S3EnvConfig = {
  S3_ACCESS_KEY_ID: string;
  S3_BUCKET: string;
  S3_ENDPOINT: string;
  S3_SECRET_ACCESS_KEY: string;
};

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    API_PORT: z.coerce.number().int().positive().default(3001),
    API_HOST: z.string().min(1).default("0.0.0.0"),
    API_GLOBAL_PREFIX: z.string().min(1).default("api/v1"),
    DATABASE_URL: z.string().min(1).default("mysql://indobraga:indobraga@localhost:3306/indobraga"),
    SESSION_COOKIE_NAME: z.string().min(1).default("indobraga_admin_session"),
    SESSION_SECRET: z.string().min(32).default("development-session-secret-change-me"),
    ADMIN_SESSION_TTL_DAYS: z.coerce.number().int().positive().default(7),
    CSRF_COOKIE_NAME: z.string().min(1).default("indobraga_csrf"),
    CREDENTIAL_ENCRYPTION_KEY: z
      .string()
      .min(32)
      .default("development-credential-secret-change-me"),
    CORS_ORIGINS: z
      .string()
      .default(
        "http://localhost:3000,http://localhost:5173,https://indobraga.com,https://www.indobraga.com",
      ),
    PUBLIC_SITE_URL: z.url().default("https://indobraga.com"),
    PUBLIC_MEDIA_URL: z.url().default("https://media.indobraga.com"),
    UPLOAD_IMAGE_MAX_MB: z.coerce.number().int().positive().default(10),
    UPLOAD_VIDEO_MAX_MB: z.coerce.number().int().positive().default(100),
    UPLOAD_VIDEO_MAX_DURATION_SECONDS: z.coerce.number().int().positive().default(120),
    MEDIA_THUMBNAIL_MAX_WIDTH: z.coerce.number().int().positive().default(480),
    MEDIA_MEDIUM_MAX_WIDTH: z.coerce.number().int().positive().default(960),
    MEDIA_LARGE_MAX_WIDTH: z.coerce.number().int().positive().default(1600),
    MEDIA_VIDEO_POSTER_MAX_WIDTH: z.coerce.number().int().positive().default(960),
    MEDIA_OBJECT_PREFIX: objectPathSegment.default("upload"),
    MEDIA_STORAGE_ENV: z.enum(["dev", "prod"]).optional(),
    MEDIA_PATH_TIME_ZONE: z.string().min(1).default("Asia/Jakarta"),
    STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
    STORAGE_LOCAL_ROOT: z.string().min(1).default(".local-storage"),
    S3_ENDPOINT: z.string().optional().default(""),
    S3_REGION: z.string().optional().default("auto"),
    S3_BUCKET: z.string().optional().default(""),
    S3_ACCESS_KEY_ID: z.string().optional().default(""),
    S3_SECRET_ACCESS_KEY: z.string().optional().default(""),
    S3_FORCE_PATH_STYLE: booleanEnv,
    INTERNAL_WORKER_SECRET: z.string().min(16).default("development-worker-secret"),
    EMAIL_PROVIDER_MODE: z.enum(["mock", "live"]).default("mock"),
    SMTP_TEST_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
    EMAIL_CAMPAIGN_RECIPIENT_MAX: z.coerce.number().int().positive().default(1000),
    EMAIL_WORKER_BATCH_SIZE: z.coerce.number().int().positive().default(50),
    EMAIL_WORKER_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),
    NOTIFICATION_EMAIL_ENABLED: booleanEnv,
    NOTIFICATION_EMAIL_TO: z.string().optional().default(""),
    NOTIFICATION_EMAIL_SENDER: z.string().optional().default(""),
    NOTIFICATION_WORKER_BATCH_SIZE: z.coerce.number().int().positive().default(20),
    NOTIFICATION_WORKER_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),
    NOTIFICATION_STREAM_HEARTBEAT_MS: z.coerce.number().int().positive().default(30_000),
    GOOGLE_OAUTH_CLIENT_ID: z.string().optional().default(""),
    GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional().default(""),
    GOOGLE_OAUTH_REDIRECT_URI: z
      .url()
      .default("http://localhost:3001/api/v1/oauth/google/email/callback"),
  })
  .superRefine((env, context) => {
    if (env.NODE_ENV !== "production") {
      if (env.STORAGE_DRIVER === "s3") {
        addS3Issues(env, context);
      }
      return;
    }

    for (const [key, value] of [
      ["SESSION_SECRET", env.SESSION_SECRET],
      ["CREDENTIAL_ENCRYPTION_KEY", env.CREDENTIAL_ENCRYPTION_KEY],
      ["INTERNAL_WORKER_SECRET", env.INTERNAL_WORKER_SECRET],
    ] as const) {
      if (value.startsWith("development-") || value.startsWith("replace-with")) {
        context.addIssue({
          code: "custom",
          path: [key],
          message: `${key} wajib memakai secret production yang kuat.`,
        });
      }
    }

    if (env.CORS_ORIGINS.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["CORS_ORIGINS"],
        message: "CORS_ORIGINS wajib eksplisit di production.",
      });
    }

    if (env.STORAGE_DRIVER !== "s3") {
      context.addIssue({
        code: "custom",
        path: ["STORAGE_DRIVER"],
        message: "STORAGE_DRIVER wajib s3 di production.",
      });
    }

    if (env.MEDIA_STORAGE_ENV === "dev") {
      context.addIssue({
        code: "custom",
        path: ["MEDIA_STORAGE_ENV"],
        message: "MEDIA_STORAGE_ENV tidak boleh dev di production.",
      });
    }

    addS3Issues(env, context);
  });

function addS3Issues(env: S3EnvConfig, context: z.RefinementCtx): void {
  for (const key of [
    "S3_ENDPOINT",
    "S3_BUCKET",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
  ] as const) {
    if (!env[key].trim()) {
      context.addIssue({
        code: "custom",
        path: [key],
        message: `${key} wajib diisi ketika STORAGE_DRIVER=s3.`,
      });
    }
  }

  if (env.S3_ENDPOINT.trim()) {
    const endpoint = z.url().safeParse(env.S3_ENDPOINT);
    if (!endpoint.success) {
      context.addIssue({
        code: "custom",
        path: ["S3_ENDPOINT"],
        message: "S3_ENDPOINT wajib berupa URL valid.",
      });
    }
  }
}

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${z.prettifyError(result.error)}`);
  }

  return result.data;
}
