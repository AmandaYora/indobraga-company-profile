import {
  Controller,
  Get,
  INestApplication,
  Module,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { IsEmail, IsNotEmpty } from "class-validator";
import type { Server } from "node:http";
import request from "supertest";
import { CoreModule } from "@/core/core.module";

class EmailQueryDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

@Controller("core-test")
class CoreTestController {
  @Get("success")
  success() {
    return { ok: true };
  }

  @Get("validation")
  validation(@Query() query: EmailQueryDto) {
    return query;
  }

  @Get("auth-error")
  authError() {
    throw new UnauthorizedException({
      code: "UNAUTHENTICATED",
      message: "Belum login atau session tidak valid.",
    });
  }
}

@Module({
  imports: [CoreModule],
  controllers: [CoreTestController],
})
class CoreTestModule {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getResponseRequestId(body: unknown): string {
  if (!isRecord(body) || !isRecord(body.meta) || typeof body.meta.request_id !== "string") {
    throw new Error("Response meta.request_id is missing.");
  }

  return body.meta.request_id;
}

function getResponseTimestamp(body: unknown): string {
  if (!isRecord(body) || !isRecord(body.meta) || typeof body.meta.timestamp !== "string") {
    throw new Error("Response meta.timestamp is missing.");
  }

  return body.meta.timestamp;
}

function getErrorDetails(body: unknown): unknown[] {
  if (!isRecord(body) || !isRecord(body.error) || !Array.isArray(body.error.details)) {
    throw new Error("Response error.details is missing.");
  }

  return body.error.details;
}

describe("API core foundation", () => {
  let app: INestApplication;
  let httpServer: Server;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CoreTestModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it("wraps successful responses in the standard envelope", async () => {
    const response = await request(httpServer).get("/api/v1/core-test/success").expect(200);
    const body: unknown = response.body;

    expect(body).toMatchObject({
      success: true,
      data: { ok: true },
    });
    expect(getResponseRequestId(body)).toMatch(/^req_/);
    expect(getResponseTimestamp(body)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(response.headers["x-request-id"]).toBe(getResponseRequestId(body));
  });

  it("returns standard validation errors", async () => {
    const response = await request(httpServer)
      .get("/api/v1/core-test/validation")
      .query({ email: "invalid-email" })
      .expect(400);
    const body: unknown = response.body;

    expect(body).toMatchObject({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Input tidak valid.",
      },
    });
    expect(getErrorDetails(body)).toContainEqual(expect.objectContaining({ field: "email" }));
    expect(getResponseRequestId(body)).toMatch(/^req_/);
  });

  it("returns standard auth errors for protected routes", async () => {
    const response = await request(httpServer).get("/api/v1/core-test/auth-error").expect(401);
    const body: unknown = response.body;

    expect(body).toMatchObject({
      success: false,
      error: {
        code: "UNAUTHENTICATED",
      },
    });
    expect(getResponseRequestId(body)).toMatch(/^req_/);
  });

  it("returns standard not found errors", async () => {
    const response = await request(httpServer).get("/api/v1/core-test/missing").expect(404);
    const body: unknown = response.body;

    expect(body).toMatchObject({
      success: false,
      error: {
        code: "NOT_FOUND",
      },
    });
    expect(getResponseRequestId(body)).toMatch(/^req_/);
  });
});
