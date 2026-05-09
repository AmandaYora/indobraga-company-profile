import "reflect-metadata";
import { RequestMethod } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import { AppModule } from "@/app.module";
import type { Env } from "@/config/env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Env, true>);
  const globalPrefix = config.get("API_GLOBAL_PREFIX", { infer: true });
  const port = config.get("API_PORT", { infer: true });
  const host = config.get("API_HOST", { infer: true });

  app.use(helmet());
  app.enableCors({
    origin: config
      .get("CORS_ORIGINS", { infer: true })
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["content-type", "x-csrf-token", "x-internal-worker-secret"],
  });
  app.setGlobalPrefix(globalPrefix, {
    exclude: [
      { path: "robots.txt", method: RequestMethod.GET },
      { path: "sitemap.xml", method: RequestMethod.GET },
    ],
  });
  app.enableShutdownHooks();

  await app.listen(port, host);
}

void bootstrap();
