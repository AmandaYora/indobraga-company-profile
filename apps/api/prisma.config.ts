import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL?.trim();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
    ...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
  },
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node prisma/seed.ts",
  },
});
