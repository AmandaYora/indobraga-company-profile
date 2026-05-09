import { Injectable } from "@nestjs/common";

@Injectable()
export class HealthService {
  check() {
    return {
      status: "ok",
      service: "indobraga-api",
      uptime_seconds: Math.round(process.uptime()),
    };
  }
}
