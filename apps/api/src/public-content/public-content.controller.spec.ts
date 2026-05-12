import { PublicContentController } from "@/public-content/public-content.controller";

const publicContentMock = () => ({
  getFacilities: jest.fn().mockResolvedValue({ machines: [] }),
  getGallery: jest.fn().mockResolvedValue({ items: [] }),
  getHome: jest.fn().mockResolvedValue({ hero: [] }),
  getNews: jest.fn().mockResolvedValue({ items: [] }),
  getNewsDetail: jest.fn().mockResolvedValue({ slug: "berita-1" }),
  getPortfolio: jest.fn().mockResolvedValue({ items: [] }),
  getSiteSettings: jest.fn().mockResolvedValue({ site_name: "Indobraga" }),
});

describe("PublicContentController", () => {
  it("proxies public content reads to the service", async () => {
    const publicContent = publicContentMock();
    const controller = new PublicContentController(publicContent as never);
    const portfolioQuery = { category: "seragam" } as never;
    const galleryQuery = { type: "image" } as never;
    const newsQuery = { page: 1 } as never;

    await expect(controller.siteSettings()).resolves.toEqual({ site_name: "Indobraga" });
    await expect(controller.home()).resolves.toEqual({ hero: [] });
    await expect(controller.portfolio(portfolioQuery)).resolves.toEqual({ items: [] });
    await expect(controller.facilities()).resolves.toEqual({ machines: [] });
    await expect(controller.gallery(galleryQuery)).resolves.toEqual({ items: [] });
    await expect(controller.news(newsQuery)).resolves.toEqual({ items: [] });
    await expect(controller.newsDetail({ slug: "berita-1" })).resolves.toEqual({
      slug: "berita-1",
    });

    expect(publicContent.getSiteSettings).toHaveBeenCalledTimes(1);
    expect(publicContent.getHome).toHaveBeenCalledTimes(1);
    expect(publicContent.getPortfolio).toHaveBeenCalledWith(portfolioQuery);
    expect(publicContent.getFacilities).toHaveBeenCalledTimes(1);
    expect(publicContent.getGallery).toHaveBeenCalledWith(galleryQuery);
    expect(publicContent.getNews).toHaveBeenCalledWith(newsQuery);
    expect(publicContent.getNewsDetail).toHaveBeenCalledWith("berita-1");
  });
});
