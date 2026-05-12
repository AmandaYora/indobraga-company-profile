import { Logger, NotFoundException } from "@nestjs/common";
import { Inquiry, InquiryStatus, WhatsAppLead, WhatsAppLeadStatus } from "@prisma/client";
import type { Request } from "express";
import { LeadsService } from "@/leads/leads.service";
import type { AuditService } from "@/audit/audit.service";
import type { AudienceService } from "@/audience/audience.service";
import type { NotificationsService } from "@/notifications/notifications.service";

const now = new Date("2026-01-01T00:00:00.000Z");

const inquiry = (overrides: Partial<Inquiry> = {}): Inquiry => ({
  id: 1,
  name: "Budi",
  email: "budi@example.com",
  phone: "08123456789",
  company: "PT Contoh",
  message: "Butuh produksi seragam.",
  status: InquiryStatus.NEW,
  internalNote: null,
  notificationStatus: "pending",
  source: "website",
  meta: null,
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const whatsAppLead = (overrides: Partial<WhatsAppLead> = {}): WhatsAppLead => ({
  id: 2,
  name: "Sari",
  phone: "08987654321",
  message: "Halo Indobraga",
  whatsappUrl: "https://wa.me/6285158700895?text=Halo%20Indobraga",
  status: WhatsAppLeadStatus.NEW,
  internalNote: null,
  source: "website",
  meta: null,
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const request = (): Request =>
  ({
    ip: "127.0.0.1",
    get: jest.fn((header: string) => {
      if (header === "referer") {
        return "https://indobraga.com/kontak";
      }
      if (header === "user-agent") {
        return "Mozilla/5.0";
      }
      return undefined;
    }),
  }) as unknown as Request;

const anonymousRequest = (): Request =>
  ({
    get: jest.fn(() => undefined),
    ip: undefined,
  }) as unknown as Request;

const prismaMock = () => ({
  inquiry: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  whatsAppLead: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  siteSettings: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
});

const notificationMock = () => ({
  createInquiryCreated: jest.fn().mockResolvedValue(undefined),
  createWhatsAppLeadCreated: jest.fn().mockResolvedValue(undefined),
});

const audienceMock = () => ({
  upsertFromInquiry: jest.fn().mockResolvedValue(undefined),
});

describe("LeadsService", () => {
  it("creates contact inquiry with request metadata", async () => {
    const prisma = prismaMock();
    prisma.inquiry.create.mockResolvedValue(inquiry());
    const notifications = notificationMock();
    const audience = audienceMock();
    const service = new LeadsService(
      prisma as never,
      { record: jest.fn() } as unknown as AuditService,
      audience as unknown as AudienceService,
      notifications as unknown as NotificationsService,
    );

    await expect(
      service.createInquiry(
        {
          name: "Budi",
          email: "budi@example.com",
          phone: "08123456789",
          company: "PT Contoh",
          message: "Butuh produksi seragam.",
        },
        request(),
      ),
    ).resolves.toEqual({ id: 1, status: "new" });

    expect(prisma.inquiry.create).toHaveBeenCalledTimes(1);
    const [createArg] = prisma.inquiry.create.mock.calls[0] as [
      { data: { name: string; notificationStatus: string; source: string } },
    ];
    expect(createArg.data.name).toBe("Budi");
    expect(createArg.data.notificationStatus).toBe("pending");
    expect(createArg.data.source).toBe("https://indobraga.com/kontak");
    expect(audience.upsertFromInquiry).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, email: "budi@example.com" }),
    );
    expect(notifications.createInquiryCreated).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, email: "budi@example.com" }),
    );
  });

  it("keeps public inquiry successful when audience and notification side effects fail", async () => {
    const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    const prisma = prismaMock();
    prisma.inquiry.create.mockResolvedValue(inquiry());
    const notifications = {
      createInquiryCreated: jest.fn().mockRejectedValue(new Error("smtp offline")),
    };
    const audience = {
      upsertFromInquiry: jest.fn().mockRejectedValue(new Error("audience offline")),
    };
    const service = new LeadsService(
      prisma as never,
      { record: jest.fn() } as unknown as AuditService,
      audience as unknown as AudienceService,
      notifications as unknown as NotificationsService,
    );

    await expect(
      service.createInquiry(
        {
          name: "Budi",
          email: "budi@example.com",
          phone: "08123456789",
          message: "Butuh produksi seragam.",
        },
        anonymousRequest(),
      ),
    ).resolves.toEqual({ id: 1, status: "new" });

    const [createArg] = prisma.inquiry.create.mock.calls[0] as [
      {
        data: {
          meta: { ip_hash: string | null; referrer: string | null; user_agent: string | null };
          source: string;
        };
      },
    ];
    expect(createArg.data.source).toBe("website");
    expect(createArg.data.meta).toEqual({
      ip_hash: null,
      referrer: null,
      user_agent: null,
    });
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it("creates WhatsApp lead with site setting number and generated message", async () => {
    const prisma = prismaMock();
    prisma.siteSettings.findUnique.mockResolvedValue({ whatsapp: "628111111111" });
    prisma.whatsAppLead.create.mockResolvedValue(
      whatsAppLead({
        whatsappUrl:
          "https://wa.me/628111111111?text=Halo%20Indobraga%2C%20saya%20Sari.%20Saya%20ingin%20konsultasi%20kebutuhan%20produksi.%20Nomor%20saya%2008987654321.",
        message:
          "Halo Indobraga, saya Sari. Saya ingin konsultasi kebutuhan produksi. Nomor saya 08987654321.",
      }),
    );
    const notifications = notificationMock();
    const service = new LeadsService(
      prisma as never,
      { record: jest.fn() } as unknown as AuditService,
      audienceMock() as unknown as AudienceService,
      notifications as unknown as NotificationsService,
    );

    const result = await service.createWhatsAppLead(
      { name: "Sari", phone: "08987654321" },
      request(),
    );

    expect(result.status).toBe("new");
    expect(result.whatsapp_url).toContain("https://wa.me/628111111111");
    expect(prisma.whatsAppLead.create).toHaveBeenCalledTimes(1);
    const [createArg] = prisma.whatsAppLead.create.mock.calls[0] as [
      { data: { name: string; phone: string; source: string } },
    ];
    expect(createArg.data.name).toBe("Sari");
    expect(createArg.data.phone).toBe("08987654321");
    expect(createArg.data.source).toBe("https://indobraga.com/kontak");
    expect(notifications.createWhatsAppLeadCreated).toHaveBeenCalledWith(
      expect.objectContaining({ id: 2, phone: "08987654321" }),
    );
  });

  it("creates WhatsApp lead with default number and custom message", async () => {
    const prisma = prismaMock();
    prisma.siteSettings.findUnique.mockResolvedValue(null);
    prisma.whatsAppLead.create.mockResolvedValue(
      whatsAppLead({
        message: "Saya ingin tanya harga.",
        whatsappUrl: "https://wa.me/6285158700895?text=Saya%20ingin%20tanya%20harga.",
      }),
    );
    const service = new LeadsService(
      prisma as never,
      { record: jest.fn() } as unknown as AuditService,
      audienceMock() as unknown as AudienceService,
      notificationMock() as unknown as NotificationsService,
    );

    await expect(
      service.createWhatsAppLead(
        { message: "Saya ingin tanya harga.", name: "Sari", phone: "08987654321" },
        anonymousRequest(),
      ),
    ).resolves.toMatchObject({
      generated_message: "Saya ingin tanya harga.",
      whatsapp_url: "https://wa.me/6285158700895?text=Saya%20ingin%20tanya%20harga.",
    });
    const [createArg] = prisma.whatsAppLead.create.mock.calls[0] as [
      { data: { message: string; source: string; whatsappUrl: string } },
    ];
    expect(createArg.data).toMatchObject({
      message: "Saya ingin tanya harga.",
      source: "website",
      whatsappUrl: "https://wa.me/6285158700895?text=Saya%20ingin%20tanya%20harga.",
    });
  });

  it("lists inquiries with status and search filters", async () => {
    const prisma = prismaMock();
    prisma.inquiry.findMany.mockResolvedValue([inquiry({ status: InquiryStatus.CONTACTED })]);
    prisma.inquiry.count.mockResolvedValue(1);
    const service = new LeadsService(
      prisma as never,
      { record: jest.fn() } as unknown as AuditService,
      audienceMock() as unknown as AudienceService,
      notificationMock() as unknown as NotificationsService,
    );

    const result = await service.listInquiries({
      page: 1,
      limit: 10,
      status: "contacted",
      q: "Budi",
    });

    expect(result.items[0]).toEqual(expect.objectContaining({ id: 1, status: "contacted" }));
    expect(prisma.inquiry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          archivedAt: null,
          status: InquiryStatus.CONTACTED,
        }) as object,
      }),
    );
  });

  it("returns inquiry detail and rejects missing inquiry detail", async () => {
    const prisma = prismaMock();
    prisma.inquiry.findFirst
      .mockResolvedValueOnce(inquiry({ internalNote: "Sudah dihubungi" }))
      .mockResolvedValueOnce(null);
    const service = new LeadsService(
      prisma as never,
      { record: jest.fn() } as unknown as AuditService,
      audienceMock() as unknown as AudienceService,
      notificationMock() as unknown as NotificationsService,
    );

    await expect(service.getInquiry(1)).resolves.toMatchObject({
      id: 1,
      internal_note: "Sudah dihubungi",
      notification_status: "pending",
      status: "new",
    });
    await expect(service.getInquiry(404)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("updates inquiry and writes audit mutation", async () => {
    const prisma = prismaMock();
    prisma.inquiry.update.mockResolvedValue(inquiry({ status: InquiryStatus.IN_PROGRESS }));
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const service = new LeadsService(
      prisma as never,
      audit as unknown as AuditService,
      audienceMock() as unknown as AudienceService,
      notificationMock() as unknown as NotificationsService,
    );

    await expect(
      service.updateInquiry(1, { status: "in_progress", internal_note: "Follow up" }, { id: 9 }),
    ).resolves.toEqual(expect.objectContaining({ status: "in_progress" }));
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 9,
        action: "inquiry.update",
        resourceType: "inquiries",
        resourceId: 1,
      }),
    );
  });

  it("archives inquiry and returns not found when update misses active row", async () => {
    const prisma = prismaMock();
    prisma.inquiry.update
      .mockResolvedValueOnce(inquiry({ archivedAt: now }))
      .mockRejectedValueOnce(new Error("missing"));
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const service = new LeadsService(
      prisma as never,
      audit as unknown as AuditService,
      audienceMock() as unknown as AudienceService,
      notificationMock() as unknown as NotificationsService,
    );

    await expect(service.archiveInquiry(1, { id: 9 })).resolves.toEqual({
      id: 1,
      status: "archived",
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "inquiry.archive",
        actorUserId: 9,
        resourceId: 1,
        resourceType: "inquiries",
      }),
    );
    await expect(
      service.updateInquiry(404, { status: "closed" }, { id: 9 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("lists, updates, and archives WhatsApp leads", async () => {
    const prisma = prismaMock();
    prisma.whatsAppLead.findMany.mockResolvedValue([
      whatsAppLead({ status: WhatsAppLeadStatus.CONTACTED }),
    ]);
    prisma.whatsAppLead.count.mockResolvedValue(1);
    prisma.whatsAppLead.update
      .mockResolvedValueOnce(
        whatsAppLead({ internalNote: "Follow up", status: WhatsAppLeadStatus.SPAM }),
      )
      .mockResolvedValueOnce(whatsAppLead({ archivedAt: now }));
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const service = new LeadsService(
      prisma as never,
      audit as unknown as AuditService,
      audienceMock() as unknown as AudienceService,
      notificationMock() as unknown as NotificationsService,
    );

    await expect(
      service.listWhatsAppLeads({ limit: 10, page: 1, q: "Sari", status: "contacted" }),
    ).resolves.toMatchObject({
      items: [{ id: 2, status: "contacted" }],
      pagination: { limit: 10, page: 1, total: 1, total_pages: 1 },
    });
    const [findManyArg] = prisma.whatsAppLead.findMany.mock.calls[0] as [
      { where: { archivedAt: null; status: WhatsAppLeadStatus } },
    ];
    expect(findManyArg.where).toMatchObject({
      archivedAt: null,
      status: WhatsAppLeadStatus.CONTACTED,
    });

    await expect(
      service.updateWhatsAppLead(2, { internal_note: "Follow up", status: "spam" }, { id: 9 }),
    ).resolves.toMatchObject({
      internal_note: "Follow up",
      status: "spam",
    });
    await expect(service.archiveWhatsAppLead(2, { id: 9 })).resolves.toEqual({
      id: 2,
      status: "archived",
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "whatsapp_lead.update",
        metadata: { has_internal_note: true, status: "spam" },
        resourceId: 2,
        resourceType: "whatsapp-leads",
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "whatsapp_lead.archive",
        resourceId: 2,
        resourceType: "whatsapp-leads",
      }),
    );
  });

  it("throws not found for missing WhatsApp lead", async () => {
    const prisma = prismaMock();
    prisma.whatsAppLead.findFirst.mockResolvedValue(null);
    const service = new LeadsService(
      prisma as never,
      { record: jest.fn() } as unknown as AuditService,
      audienceMock() as unknown as AudienceService,
      notificationMock() as unknown as NotificationsService,
    );

    await expect(service.getWhatsAppLead(404)).rejects.toBeInstanceOf(NotFoundException);
  });
});
