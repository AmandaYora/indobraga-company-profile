import { NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { EmailContentMode, EmailTemplate } from "@prisma/client";
import type { AuditService } from "@/audit/audit.service";
import { EmailTemplatesService } from "@/email-templates/email-templates.service";

const now = new Date("2026-01-01T00:00:00.000Z");

const template = (overrides: Partial<EmailTemplate> = {}): EmailTemplate => ({
  id: 5,
  name: "Sapaan Awal",
  subject: "Terima kasih {{nama}}",
  contentMode: EmailContentMode.TEXT,
  bodyText: "Halo {{nama}}",
  bodyHtml: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const prismaMock = () => ({
  $transaction: jest.fn((ops: unknown) => Promise.all(ops as Promise<unknown>[])),
  emailTemplate: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
});

const build = (prisma: ReturnType<typeof prismaMock>, audit = { record: jest.fn() }) =>
  new EmailTemplatesService(prisma as never, audit as unknown as AuditService);

describe("EmailTemplatesService", () => {
  it("lists templates with API content mode mapping", async () => {
    const prisma = prismaMock();
    prisma.emailTemplate.findMany.mockResolvedValue([
      template({ contentMode: EmailContentMode.HTML, bodyText: null, bodyHtml: "<p>Hi</p>" }),
    ]);
    prisma.emailTemplate.count.mockResolvedValue(1);

    await expect(build(prisma).list({ q: "sapaan" })).resolves.toMatchObject({
      items: [{ id: 5, name: "Sapaan Awal", content_mode: "html", body_html: "<p>Hi</p>" }],
      pagination: { total: 1 },
    });
    expect(prisma.emailTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ name: { contains: "sapaan" } }, { subject: { contains: "sapaan" } }] },
      }),
    );
  });

  it("creates a text template and records an audit entry", async () => {
    const prisma = prismaMock();
    prisma.emailTemplate.create.mockResolvedValue(template());
    const audit = { record: jest.fn().mockResolvedValue(undefined) };

    await expect(
      build(prisma, audit).create(
        {
          name: "Sapaan Awal",
          subject: "Terima kasih {{nama}}",
          content_mode: "text",
          body_text: "Halo {{nama}}",
        },
        { id: 9 },
      ),
    ).resolves.toMatchObject({ id: 5, content_mode: "text" });

    expect(prisma.emailTemplate.create).toHaveBeenCalledWith({
      data: {
        name: "Sapaan Awal",
        subject: "Terima kasih {{nama}}",
        contentMode: EmailContentMode.TEXT,
        bodyText: "Halo {{nama}}",
        bodyHtml: null,
      },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "email_template.create", resourceId: 5 }),
    );
  });

  it("creates an HTML template using the raw HTML body", async () => {
    const prisma = prismaMock();
    prisma.emailTemplate.create.mockResolvedValue(
      template({ contentMode: EmailContentMode.HTML, bodyText: null, bodyHtml: "<p>Hi</p>" }),
    );

    await build(prisma).create(
      {
        name: "Promo",
        subject: "Promo",
        content_mode: "html",
        body_html: "<p>Hi</p>",
      },
      { id: 9 },
    );

    expect(prisma.emailTemplate.create).toHaveBeenCalledWith({
      data: {
        name: "Promo",
        subject: "Promo",
        contentMode: EmailContentMode.HTML,
        bodyText: null,
        bodyHtml: "<p>Hi</p>",
      },
    });
  });

  it("rejects templates without a body matching the mode", async () => {
    const prisma = prismaMock();

    await expect(
      build(prisma).create(
        { name: "Kosong", subject: "Kosong", content_mode: "html" },
        { id: 9 },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    await expect(
      build(prisma).create(
        { name: "Kosong", subject: "Kosong", content_mode: "text", body_text: "  " },
        { id: 9 },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(prisma.emailTemplate.create).not.toHaveBeenCalled();
  });

  it("updates a template by merging with the stored content", async () => {
    const prisma = prismaMock();
    prisma.emailTemplate.findUnique.mockResolvedValue(template());
    prisma.emailTemplate.update.mockResolvedValue(template({ name: "Sapaan Baru" }));
    const audit = { record: jest.fn().mockResolvedValue(undefined) };

    await expect(build(prisma, audit).update(5, { name: "Sapaan Baru" }, { id: 9 })).resolves.toMatchObject(
      { id: 5, name: "Sapaan Baru" },
    );
    expect(prisma.emailTemplate.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: {
        name: "Sapaan Baru",
        subject: undefined,
        contentMode: EmailContentMode.TEXT,
        bodyText: "Halo {{nama}}",
        bodyHtml: null,
      },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "email_template.update", resourceId: 5 }),
    );
  });

  it("deletes a template and records an audit entry", async () => {
    const prisma = prismaMock();
    prisma.emailTemplate.findUnique.mockResolvedValue(template());
    prisma.emailTemplate.delete.mockResolvedValue(template());
    const audit = { record: jest.fn().mockResolvedValue(undefined) };

    await expect(build(prisma, audit).remove(5, { id: 9 })).resolves.toEqual({
      id: 5,
      status: "deleted",
    });
    expect(prisma.emailTemplate.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "email_template.delete", resourceId: 5 }),
    );
  });

  it("throws when updating or deleting a missing template", async () => {
    const prisma = prismaMock();
    prisma.emailTemplate.findUnique.mockResolvedValue(null);

    await expect(build(prisma).update(99, { name: "x" }, { id: 9 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(build(prisma).remove(99, { id: 9 })).rejects.toBeInstanceOf(NotFoundException);
  });
});
