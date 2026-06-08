import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import type { Server } from "node:http";
import request from "supertest";
import { AppModule } from "@/app.module";

type HealthResponse = {
  success: boolean;
  data: {
    checks: {
      database: {
        latency_ms: number;
        status: string;
      };
    };
    status: string;
    service: string;
  };
  meta: {
    request_id: string;
    timestamp: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isHealthResponse(value: unknown): value is HealthResponse {
  if (!isRecord(value) || !isRecord(value.data) || !isRecord(value.meta)) {
    return false;
  }

  return (
    typeof value.success === "boolean" &&
    isRecord(value.data.checks) &&
    isRecord(value.data.checks.database) &&
    typeof value.data.checks.database.status === "string" &&
    typeof value.data.checks.database.latency_ms === "number" &&
    typeof value.data.status === "string" &&
    typeof value.data.service === "string" &&
    typeof value.meta.request_id === "string" &&
    typeof value.meta.timestamp === "string"
  );
}

describe("Health endpoint", () => {
  let app: INestApplication;
  let httpServer: Server;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1/health", async () => {
    const response = await request(httpServer).get("/api/v1/health").expect(200);
    const body: unknown = response.body;

    expect(isHealthResponse(body)).toBe(true);
    if (!isHealthResponse(body)) {
      throw new Error("Unexpected health response shape");
    }

    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ok");
    expect(body.data.service).toBe("indobraga-api");
    expect(body.data.checks.database.status).toBe("ok");
    expect(body.data.checks.database.latency_ms).toEqual(expect.any(Number));
    expect(body.meta.request_id).toMatch(/^req_/);
    expect(body.meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.headers["x-request-id"]).toBe(body.meta.request_id);
  });
});
