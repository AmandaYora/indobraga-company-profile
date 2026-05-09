import { Controller, Get } from "@nestjs/common";
import { NoStore } from "@/core/cache-control.decorator";
import { HealthService } from "@/health/health.service";

@Controller("health")
@NoStore()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check() {
    return this.healthService.check();
  }
}
