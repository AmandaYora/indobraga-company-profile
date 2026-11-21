import { AdminSearchService } from "@/admin-search/admin-search.service";

const findMany = () => jest.fn().mockResolvedValue([]);

const prismaMock = () => ({
  heroSection: { findMany: findMany() },
  partner: { findMany: findMany() },
  portfolio: { findMany: findMany() },
  machine: { findMany: findMany() },
  serviceItem: { findMany: findMany() },
  galleryItem: { findMany: findMany() },
  newsArticle: { findMany: findMany() },
  inquiry: { findMany: findMany() },
  whatsAppLead: { findMany: findMany() },
});

describe("AdminSearchService (QA IB-04)", () => {
  it("searches content and leads and groups the hits with their admin page", async () => {
    const prisma = prismaMock();
    prisma.newsArticle.findMany.mockResolvedValue([
      { id: 5, title: "Persib Juara", category: "Berita", excerpt: "x", slug: "persib-juara" },
    ]);
    prisma.inquiry.findMany.mockResolvedValue([
      { id: 9, name: "Budi Persib", email: "budi@example.com" },
    ]);
    const service = new AdminSearchService(prisma as never);

    const result = await service.search("Persib", ["content.manage", "leads.read"]);

    expect(result.total).toBe(2);
    expect(result.groups).toEqual([
      {
        key: "news",
        label: "Berita",
        items: [{ id: 5, title: "Persib Juara", subtitle: "Berita", to: "/admin/news" }],
      },
      {
        key: "inquiries",
        label: "Pesan Kontak",
        items: [
          { id: 9, title: "Budi Persib", subtitle: "budi@example.com", to: "/admin/inquiries" },
        ],
      },
    ]);
    const where = (prisma.newsArticle.findMany.mock.calls[0] as [{ where: unknown }])[0].where;
    expect(JSON.stringify(where)).toContain("Persib");
  });

  it("omits the whole content area when the user lacks content permissions", async () => {
    const prisma = prismaMock();
    prisma.inquiry.findMany.mockResolvedValue([{ id: 1, name: "Ani", email: "ani@example.com" }]);
    const service = new AdminSearchService(prisma as never);

    const result = await service.search("Ani", ["leads.read"]);

    expect(prisma.newsArticle.findMany).not.toHaveBeenCalled();
    expect(prisma.portfolio.findMany).not.toHaveBeenCalled();
    expect(result.groups.map((group) => group.key)).toEqual(["inquiries"]);
  });

  it("returns nothing (and queries nothing) for a user without any read permission", async () => {
    const prisma = prismaMock();
    const service = new AdminSearchService(prisma as never);

    await expect(service.search("anything", ["dashboard.read"])).resolves.toEqual({
      query: "anything",
      total: 0,
      groups: [],
    });
    expect(prisma.inquiry.findMany).not.toHaveBeenCalled();
  });

  it("skips archived content and limits every group", async () => {
    const prisma = prismaMock();
    const service = new AdminSearchService(prisma as never);

    await service.search("Persib", ["content.manage"]);

    const call = prisma.portfolio.findMany.mock.calls[0] as [
      { where: { status: unknown }; take: number },
    ];
    expect(call[0].where.status).toEqual({ not: "ARCHIVED" });
    expect(call[0].take).toBe(5);
  });
});
