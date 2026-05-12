import { UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import type { Env } from "@/config/env";
import { SeoAssetsController } from "@/seo-assets/seo-assets.controller";

const configMock = (secret = "worker-secret") =>
  ({
    get: jest.fn((key: string) => (key === "INTERNAL_WORKER_SECRET" ? secret : undefined)),
  }) as unknown as ConfigService<Env, true>;

const responseMock = () =>
  ({
    send: jest.fn(),
    type: jest.fn().mockReturnThis(),
  }) as unknown as Response & { send: jest.Mock; type: jest.Mock };

const seoAssetsMock = () => ({
  robotsText: jest.fn().mockReturnValue("User-agent: *"),
  seo: jest.fn().mockResolvedValue({ title: "Beranda" }),
  sitemapXml: jest.fn().mockResolvedValue("<urlset />"),
});

describe("SeoAssetsController", () => {
  it("writes robots and sitemap using raw response", async () => {
    const seoAssets = seoAssetsMock();
    const controller = new SeoAssetsController(
      seoAssets as never,
      { processPending: jest.fn() } as never,
      configMock(),
    );
    const robotsResponse = responseMock();
    const sitemapResponse = responseMock();

    controller.robots(robotsResponse);
    await controller.sitemap(sitemapResponse);

    expect(robotsResponse.type).toHaveBeenCalledWith("text/plain");
    expect(robotsResponse.send).toHaveBeenCalledWith("User-agent: *");
    expect(sitemapResponse.type).toHaveBeenCalledWith("application/xml");
    expect(sitemapResponse.send).toHaveBeenCalledWith("<urlset />");
  });

  it("proxies SEO data and protects internal revalidation tick", async () => {
    const revalidation = { processPending: jest.fn().mockResolvedValue({ processed: 1 }) };
    const seoAssets = seoAssetsMock();
    const controller = new SeoAssetsController(
      seoAssets as never,
      revalidation as never,
      configMock("expected"),
    );

    await expect(controller.seo({ route: "home" })).resolves.toEqual({ title: "Beranda" });
    await expect(controller.revalidationTick("expected")).resolves.toEqual({ processed: 1 });
    expect(() => controller.revalidationTick("wrong")).toThrow(UnauthorizedException);
    expect(seoAssets.seo).toHaveBeenCalledWith("home");
    expect(revalidation.processPending).toHaveBeenCalledTimes(1);
  });
});
