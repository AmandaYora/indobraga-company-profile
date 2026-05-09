import { Test } from "@nestjs/testing";
import { HealthController } from "@/health/health.controller";
import { HealthService } from "@/health/health.service";

describe("HealthController", () => {
  let controller: HealthController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it("returns service health data", () => {
    const response = controller.check();

    expect(response.status).toBe("ok");
    expect(response.service).toBe("indobraga-api");
    expect(response.uptime_seconds).toEqual(expect.any(Number));
  });
});
