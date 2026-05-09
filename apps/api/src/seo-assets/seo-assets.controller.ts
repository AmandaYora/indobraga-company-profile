import { Controller, Get, Headers, Param, Post, Res, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import type { Env } from "@/config/env";
import { PublicRoute } from "@/auth/auth.decorators";
import { SeoAssetCache, NoStore } from "@/core/cache-control.decorator";
import { SeoRouteParamDto } from "@/seo-assets/dto/seo-route-param.dto";
import { SeoAssetsService } from "@/seo-assets/seo-assets.service";
import { RevalidationService } from "@/revalidation/revalidation.service";

@Controller()
@PublicRoute()
export class SeoAssetsController {
  constructor(
    private readonly seoAssets: SeoAssetsService,
    private readonly revalidation: RevalidationService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get("robots.txt")
  @SeoAssetCache()
  robots(@Res() response: Response): void {
    response.type("text/plain").send(this.seoAssets.robotsText());
  }

  @Get("sitemap.xml")
  @SeoAssetCache()
  async sitemap(@Res() response: Response): Promise<void> {
    response.type("application/xml").send(await this.seoAssets.sitemapXml());
  }

  @Get("public/seo/:route")
  @SeoAssetCache()
  seo(@Param() params: SeoRouteParamDto) {
    return this.seoAssets.seo(params.route);
  }

  @Post("internal/revalidation/tick")
  @NoStore()
  revalidationTick(@Headers("x-internal-worker-secret") secret: string | undefined) {
    if (secret !== this.config.get("INTERNAL_WORKER_SECRET", { infer: true })) {
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "Internal worker secret tidak valid.",
      });
    }

    return this.revalidation.processPending();
  }
}
