import { Test } from "@nestjs/testing";
import { HealthController } from "@/health/health.controller";
import { HealthService } from "@/health/health.service";

describe("HealthController", () => {
  let controller: HealthController;
  let healthService: { check: jest.Mock };

  beforeEach(async () => {
    healthService = {
      check: jest.fn().mockResolvedValue({
        status: "ok",
        service: "indobraga-api",
        uptime_seconds: 1,
        checks: {
          database: {
            status: "ok",
            latency_ms: 3,
          },
        },
      }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: healthService }],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it("returns service health data", async () => {
    const response = await controller.check();

    expect(response.status).toBe("ok");
    expect(response.service).toBe("indobraga-api");
    expect(response.uptime_seconds).toEqual(expect.any(Number));
    expect(response.checks.database.status).toBe("ok");
    expect(response.checks.database.latency_ms).toEqual(expect.any(Number));
    expect(healthService.check).toHaveBeenCalledTimes(1);
  });
});
