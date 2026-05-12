import type { Request } from "express";
import { LeadsController } from "@/leads/leads.controller";

const request = { adminUser: { id: 9 } } as unknown as Request;
const publicRequest = { get: jest.fn(), ip: "127.0.0.1" } as unknown as Request;

const leadsMock = () => ({
  archiveInquiry: jest.fn().mockResolvedValue({ id: 1, status: "archived" }),
  archiveWhatsAppLead: jest.fn().mockResolvedValue({ id: 2, status: "archived" }),
  createInquiry: jest.fn().mockResolvedValue({ id: 1, status: "new" }),
  createWhatsAppLead: jest
    .fn()
    .mockResolvedValue({ id: 2, status: "new", whatsapp_url: "https://wa.me/628" }),
  getInquiry: jest.fn().mockResolvedValue({ id: 1 }),
  getWhatsAppLead: jest.fn().mockResolvedValue({ id: 2 }),
  listInquiries: jest.fn().mockResolvedValue({ items: [] }),
  listWhatsAppLeads: jest.fn().mockResolvedValue({ items: [] }),
  updateInquiry: jest.fn().mockResolvedValue({ id: 1, status: "contacted" }),
  updateWhatsAppLead: jest.fn().mockResolvedValue({ id: 2, status: "spam" }),
});

describe("LeadsController", () => {
  it("proxies public lead creation requests", async () => {
    const leads = leadsMock();
    const controller = new LeadsController(leads as never);
    const inquiryDto = {
      email: "budi@example.com",
      message: "Butuh produksi.",
      name: "Budi",
      phone: "0812",
    };
    const whatsAppDto = { name: "Sari", phone: "0898" };

    await expect(controller.createInquiry(inquiryDto, publicRequest)).resolves.toEqual({
      id: 1,
      status: "new",
    });
    await expect(controller.createWhatsAppLead(whatsAppDto, publicRequest)).resolves.toEqual({
      id: 2,
      status: "new",
      whatsapp_url: "https://wa.me/628",
    });
    expect(leads.createInquiry).toHaveBeenCalledWith(inquiryDto, publicRequest);
    expect(leads.createWhatsAppLead).toHaveBeenCalledWith(whatsAppDto, publicRequest);
  });

  it("proxies admin inquiry requests with actor id", async () => {
    const leads = leadsMock();
    const controller = new LeadsController(leads as never);
    const query = { page: 1, status: "new" } as never;
    const dto = { internal_note: "Follow up", status: "contacted" } as never;

    await expect(controller.inquiries(query)).resolves.toEqual({ items: [] });
    await expect(controller.inquiryDetail({ id: 1 })).resolves.toEqual({ id: 1 });
    await expect(controller.updateInquiry({ id: 1 }, dto, request)).resolves.toEqual({
      id: 1,
      status: "contacted",
    });
    await expect(controller.archiveInquiry({ id: 1 }, request)).resolves.toEqual({
      id: 1,
      status: "archived",
    });

    expect(leads.listInquiries).toHaveBeenCalledWith(query);
    expect(leads.getInquiry).toHaveBeenCalledWith(1);
    expect(leads.updateInquiry).toHaveBeenCalledWith(1, dto, { id: 9 });
    expect(leads.archiveInquiry).toHaveBeenCalledWith(1, { id: 9 });
  });

  it("proxies admin WhatsApp lead requests with actor id", async () => {
    const leads = leadsMock();
    const controller = new LeadsController(leads as never);
    const query = { page: 1, status: "spam" } as never;
    const dto = { status: "spam" } as never;

    await expect(controller.whatsAppLeads(query)).resolves.toEqual({ items: [] });
    await expect(controller.whatsAppLeadDetail({ id: 2 })).resolves.toEqual({ id: 2 });
    await expect(controller.updateWhatsAppLead({ id: 2 }, dto, request)).resolves.toEqual({
      id: 2,
      status: "spam",
    });
    await expect(controller.archiveWhatsAppLead({ id: 2 }, request)).resolves.toEqual({
      id: 2,
      status: "archived",
    });

    expect(leads.listWhatsAppLeads).toHaveBeenCalledWith(query);
    expect(leads.getWhatsAppLead).toHaveBeenCalledWith(2);
    expect(leads.updateWhatsAppLead).toHaveBeenCalledWith(2, dto, { id: 9 });
    expect(leads.archiveWhatsAppLead).toHaveBeenCalledWith(2, { id: 9 });
  });
});
