import type { Request } from "express";
import { ContentStatus } from "@prisma/client";
import { AdminContentController } from "@/admin-content/admin-content.controller";
import type { AdminContentService } from "@/admin-content/admin-content.service";

type ContentMock = Record<string, jest.Mock>;

function contentMock(): ContentMock {
  return new Proxy(
    {},
    {
      get(target: ContentMock, property: string) {
        target[property] ??= jest.fn((...args: unknown[]) => ({ args, method: property }));
        return target[property];
      },
    },
  ) as ContentMock;
}

function request(adminUserId?: number): Request {
  return {
    adminUser: adminUserId ? { id: adminUserId, email: "admin@example.com", permissions: [] } : undefined,
  } as Request;
}

describe("AdminContentController", () => {
  const query = { page: 1, page_size: 10 };
  const dto = { title: "Judul" };
  const params = { id: 42 };
  const reorderDto = { items: [{ id: 42, sort_order: 1 }] };
  const statusDto = { status: ContentStatus.PUBLISHED };
  const adminRequest = request(9);
  const actor = { id: 9 };

  it("delegates admin content routes to the content service", () => {
    const content = contentMock();
    const controller = new AdminContentController(content as unknown as AdminContentService);

    const cases: Array<{
      args: unknown[];
      expectedArgs: unknown[];
      method: string;
      serviceMethod: string;
    }> = [
      { method: "siteSettings", serviceMethod: "getSiteSettings", args: [], expectedArgs: [] },
      {
        method: "updateSiteSettings",
        serviceMethod: "updateSiteSettings",
        args: [dto, adminRequest],
        expectedArgs: [dto, actor],
      },
      { method: "hero", serviceMethod: "listHero", args: [query], expectedArgs: [query] },
      { method: "heroDetail", serviceMethod: "getHero", args: [params], expectedArgs: [42] },
      {
        method: "createHero",
        serviceMethod: "createHero",
        args: [dto, adminRequest],
        expectedArgs: [dto, actor],
      },
      {
        method: "heroStatus",
        serviceMethod: "updateStatus",
        args: [params, statusDto, adminRequest],
        expectedArgs: ["hero", 42, ContentStatus.PUBLISHED, actor],
      },
      {
        method: "updateHero",
        serviceMethod: "updateHero",
        args: [params, dto, adminRequest],
        expectedArgs: [42, dto, actor],
      },
      {
        method: "deleteHero",
        serviceMethod: "deleteResource",
        args: [params, adminRequest],
        expectedArgs: ["hero", 42, actor],
      },
      {
        method: "heroSlides",
        serviceMethod: "listHeroSlides",
        args: [query],
        expectedArgs: [query],
      },
      {
        method: "reorderHeroSlides",
        serviceMethod: "reorder",
        args: [reorderDto, adminRequest],
        expectedArgs: ["hero-slides", reorderDto, actor],
      },
      {
        method: "heroSlideDetail",
        serviceMethod: "getHeroSlide",
        args: [params],
        expectedArgs: [42],
      },
      {
        method: "createHeroSlide",
        serviceMethod: "createHeroSlide",
        args: [dto, adminRequest],
        expectedArgs: [dto, actor],
      },
      {
        method: "heroSlideStatus",
        serviceMethod: "updateStatus",
        args: [params, statusDto, adminRequest],
        expectedArgs: ["hero-slides", 42, ContentStatus.PUBLISHED, actor],
      },
      {
        method: "updateHeroSlide",
        serviceMethod: "updateHeroSlide",
        args: [params, dto, adminRequest],
        expectedArgs: [42, dto, actor],
      },
      {
        method: "deleteHeroSlide",
        serviceMethod: "deleteResource",
        args: [params, adminRequest],
        expectedArgs: ["hero-slides", 42, actor],
      },
      { method: "partners", serviceMethod: "listPartners", args: [query], expectedArgs: [query] },
      {
        method: "reorderPartners",
        serviceMethod: "reorder",
        args: [reorderDto, adminRequest],
        expectedArgs: ["partners", reorderDto, actor],
      },
      { method: "partnerDetail", serviceMethod: "getPartner", args: [params], expectedArgs: [42] },
      {
        method: "createPartner",
        serviceMethod: "createPartner",
        args: [dto, adminRequest],
        expectedArgs: [dto, actor],
      },
      {
        method: "partnerStatus",
        serviceMethod: "updateStatus",
        args: [params, statusDto, adminRequest],
        expectedArgs: ["partners", 42, ContentStatus.PUBLISHED, actor],
      },
      {
        method: "updatePartner",
        serviceMethod: "updatePartner",
        args: [params, dto, adminRequest],
        expectedArgs: [42, dto, actor],
      },
      {
        method: "deletePartner",
        serviceMethod: "deleteResource",
        args: [params, adminRequest],
        expectedArgs: ["partners", 42, actor],
      },
      {
        method: "strengths",
        serviceMethod: "listStrengths",
        args: [query],
        expectedArgs: [query],
      },
      {
        method: "reorderStrengths",
        serviceMethod: "reorder",
        args: [reorderDto, adminRequest],
        expectedArgs: ["production-strengths", reorderDto, actor],
      },
      {
        method: "strengthDetail",
        serviceMethod: "getStrength",
        args: [params],
        expectedArgs: [42],
      },
      {
        method: "createStrength",
        serviceMethod: "createStrength",
        args: [dto, adminRequest],
        expectedArgs: [dto, actor],
      },
      {
        method: "strengthStatus",
        serviceMethod: "updateStatus",
        args: [params, statusDto, adminRequest],
        expectedArgs: ["production-strengths", 42, ContentStatus.PUBLISHED, actor],
      },
      {
        method: "updateStrength",
        serviceMethod: "updateStrength",
        args: [params, dto, adminRequest],
        expectedArgs: [42, dto, actor],
      },
      {
        method: "deleteStrength",
        serviceMethod: "deleteResource",
        args: [params, adminRequest],
        expectedArgs: ["production-strengths", 42, actor],
      },
      {
        method: "portfolioCategories",
        serviceMethod: "listPortfolioCategories",
        args: [query],
        expectedArgs: [query],
      },
      {
        method: "reorderPortfolioCategories",
        serviceMethod: "reorder",
        args: [reorderDto, adminRequest],
        expectedArgs: ["portfolio-categories", reorderDto, actor],
      },
      {
        method: "portfolioCategoryDetail",
        serviceMethod: "getPortfolioCategory",
        args: [params],
        expectedArgs: [42],
      },
      {
        method: "createPortfolioCategory",
        serviceMethod: "createPortfolioCategory",
        args: [dto, adminRequest],
        expectedArgs: [dto, actor],
      },
      {
        method: "portfolioCategoryStatus",
        serviceMethod: "updateStatus",
        args: [params, statusDto, adminRequest],
        expectedArgs: ["portfolio-categories", 42, ContentStatus.PUBLISHED, actor],
      },
      {
        method: "updatePortfolioCategory",
        serviceMethod: "updatePortfolioCategory",
        args: [params, dto, adminRequest],
        expectedArgs: [42, dto, actor],
      },
      {
        method: "deletePortfolioCategory",
        serviceMethod: "deleteResource",
        args: [params, adminRequest],
        expectedArgs: ["portfolio-categories", 42, actor],
      },
      { method: "portfolios", serviceMethod: "listPortfolios", args: [query], expectedArgs: [query] },
      {
        method: "reorderPortfolios",
        serviceMethod: "reorder",
        args: [reorderDto, adminRequest],
        expectedArgs: ["portfolios", reorderDto, actor],
      },
      { method: "portfolioDetail", serviceMethod: "getPortfolio", args: [params], expectedArgs: [42] },
      {
        method: "createPortfolio",
        serviceMethod: "createPortfolio",
        args: [dto, adminRequest],
        expectedArgs: [dto, actor],
      },
      {
        method: "portfolioStatus",
        serviceMethod: "updateStatus",
        args: [params, statusDto, adminRequest],
        expectedArgs: ["portfolios", 42, ContentStatus.PUBLISHED, actor],
      },
      {
        method: "updatePortfolio",
        serviceMethod: "updatePortfolio",
        args: [params, dto, adminRequest],
        expectedArgs: [42, dto, actor],
      },
      {
        method: "deletePortfolio",
        serviceMethod: "deleteResource",
        args: [params, adminRequest],
        expectedArgs: ["portfolios", 42, actor],
      },
      { method: "machines", serviceMethod: "listMachines", args: [query], expectedArgs: [query] },
      {
        method: "reorderMachines",
        serviceMethod: "reorder",
        args: [reorderDto, adminRequest],
        expectedArgs: ["machines", reorderDto, actor],
      },
      { method: "machineDetail", serviceMethod: "getMachine", args: [params], expectedArgs: [42] },
      {
        method: "createMachine",
        serviceMethod: "createMachine",
        args: [dto, adminRequest],
        expectedArgs: [dto, actor],
      },
      {
        method: "machineStatus",
        serviceMethod: "updateStatus",
        args: [params, statusDto, adminRequest],
        expectedArgs: ["machines", 42, ContentStatus.PUBLISHED, actor],
      },
      {
        method: "updateMachine",
        serviceMethod: "updateMachine",
        args: [params, dto, adminRequest],
        expectedArgs: [42, dto, actor],
      },
      {
        method: "deleteMachine",
        serviceMethod: "deleteResource",
        args: [params, adminRequest],
        expectedArgs: ["machines", 42, actor],
      },
      {
        method: "printingCapacities",
        serviceMethod: "listPrintingCapacities",
        args: [query],
        expectedArgs: [query],
      },
      {
        method: "reorderPrintingCapacities",
        serviceMethod: "reorder",
        args: [reorderDto, adminRequest],
        expectedArgs: ["printing-capacities", reorderDto, actor],
      },
      {
        method: "printingCapacityDetail",
        serviceMethod: "getPrintingCapacity",
        args: [params],
        expectedArgs: [42],
      },
      {
        method: "createPrintingCapacity",
        serviceMethod: "createPrintingCapacity",
        args: [dto, adminRequest],
        expectedArgs: [dto, actor],
      },
      {
        method: "printingCapacityStatus",
        serviceMethod: "updateStatus",
        args: [params, statusDto, adminRequest],
        expectedArgs: ["printing-capacities", 42, ContentStatus.PUBLISHED, actor],
      },
      {
        method: "updatePrintingCapacity",
        serviceMethod: "updatePrintingCapacity",
        args: [params, dto, adminRequest],
        expectedArgs: [42, dto, actor],
      },
      {
        method: "deletePrintingCapacity",
        serviceMethod: "deleteResource",
        args: [params, adminRequest],
        expectedArgs: ["printing-capacities", 42, actor],
      },
      {
        method: "productionCapacities",
        serviceMethod: "listProductionCapacities",
        args: [query],
        expectedArgs: [query],
      },
      {
        method: "reorderProductionCapacities",
        serviceMethod: "reorder",
        args: [reorderDto, adminRequest],
        expectedArgs: ["production-capacities", reorderDto, actor],
      },
      {
        method: "productionCapacityDetail",
        serviceMethod: "getProductionCapacity",
        args: [params],
        expectedArgs: [42],
      },
      {
        method: "createProductionCapacity",
        serviceMethod: "createProductionCapacity",
        args: [dto, adminRequest],
        expectedArgs: [dto, actor],
      },
      {
        method: "productionCapacityStatus",
        serviceMethod: "updateStatus",
        args: [params, statusDto, adminRequest],
        expectedArgs: ["production-capacities", 42, ContentStatus.PUBLISHED, actor],
      },
      {
        method: "updateProductionCapacity",
        serviceMethod: "updateProductionCapacity",
        args: [params, dto, adminRequest],
        expectedArgs: [42, dto, actor],
      },
      {
        method: "deleteProductionCapacity",
        serviceMethod: "deleteResource",
        args: [params, adminRequest],
        expectedArgs: ["production-capacities", 42, actor],
      },
      { method: "services", serviceMethod: "listServices", args: [query], expectedArgs: [query] },
      {
        method: "reorderServices",
        serviceMethod: "reorder",
        args: [reorderDto, adminRequest],
        expectedArgs: ["services", reorderDto, actor],
      },
      { method: "serviceDetail", serviceMethod: "getService", args: [params], expectedArgs: [42] },
      {
        method: "createService",
        serviceMethod: "createService",
        args: [dto, adminRequest],
        expectedArgs: [dto, actor],
      },
      {
        method: "serviceStatus",
        serviceMethod: "updateStatus",
        args: [params, statusDto, adminRequest],
        expectedArgs: ["services", 42, ContentStatus.PUBLISHED, actor],
      },
      {
        method: "updateService",
        serviceMethod: "updateService",
        args: [params, dto, adminRequest],
        expectedArgs: [42, dto, actor],
      },
      {
        method: "deleteService",
        serviceMethod: "deleteResource",
        args: [params, adminRequest],
        expectedArgs: ["services", 42, actor],
      },
      {
        method: "galleryItems",
        serviceMethod: "listGalleryItems",
        args: [query],
        expectedArgs: [query],
      },
      {
        method: "reorderGalleryItems",
        serviceMethod: "reorder",
        args: [reorderDto, adminRequest],
        expectedArgs: ["gallery-items", reorderDto, actor],
      },
      {
        method: "galleryItemDetail",
        serviceMethod: "getGalleryItem",
        args: [params],
        expectedArgs: [42],
      },
      {
        method: "createGalleryItem",
        serviceMethod: "createGalleryItem",
        args: [dto, adminRequest],
        expectedArgs: [dto, actor],
      },
      {
        method: "galleryItemStatus",
        serviceMethod: "updateStatus",
        args: [params, statusDto, adminRequest],
        expectedArgs: ["gallery-items", 42, ContentStatus.PUBLISHED, actor],
      },
      {
        method: "updateGalleryItem",
        serviceMethod: "updateGalleryItem",
        args: [params, dto, adminRequest],
        expectedArgs: [42, dto, actor],
      },
      {
        method: "deleteGalleryItem",
        serviceMethod: "deleteResource",
        args: [params, adminRequest],
        expectedArgs: ["gallery-items", 42, actor],
      },
      { method: "news", serviceMethod: "listNews", args: [query], expectedArgs: [query] },
      { method: "newsDetail", serviceMethod: "getNews", args: [params], expectedArgs: [42] },
      {
        method: "createNews",
        serviceMethod: "createNews",
        args: [dto, adminRequest],
        expectedArgs: [dto, actor],
      },
      {
        method: "newsStatus",
        serviceMethod: "updateStatus",
        args: [params, statusDto, adminRequest],
        expectedArgs: ["news", 42, ContentStatus.PUBLISHED, actor],
      },
      {
        method: "updateNews",
        serviceMethod: "updateNews",
        args: [params, dto, adminRequest],
        expectedArgs: [42, dto, actor],
      },
      {
        method: "deleteNews",
        serviceMethod: "deleteResource",
        args: [params, adminRequest],
        expectedArgs: ["news", 42, actor],
      },
      {
        method: "archiveResource",
        serviceMethod: "archiveResourceByName",
        args: ["news", 42, adminRequest],
        expectedArgs: ["news", 42, actor],
      },
      {
        method: "unarchiveResource",
        serviceMethod: "unarchiveResourceByName",
        args: ["news", 42, adminRequest],
        expectedArgs: ["news", 42, actor],
      },
    ];

    for (const testCase of cases) {
      const result = (
        controller as unknown as Record<string, (...args: unknown[]) => unknown>
      )[testCase.method](...testCase.args);

      expect(result).toEqual({
        args: testCase.expectedArgs,
        method: testCase.serviceMethod,
      });
      expect(content[testCase.serviceMethod]).toHaveBeenLastCalledWith(...testCase.expectedArgs);
    }
  });

  it("keeps actor id optional when no admin user is attached", () => {
    const content = contentMock();
    const controller = new AdminContentController(content as unknown as AdminContentService);

    expect(controller.createHero(dto, request())).toEqual({
      args: [dto, { id: undefined }],
      method: "createHero",
    });
  });
});
