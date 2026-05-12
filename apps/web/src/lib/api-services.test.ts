import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  adminApiRequest: vi.fn((path: string, options?: unknown) => Promise.resolve({ options, path })),
  authApiRequest: vi.fn((path: string, options?: unknown) => Promise.resolve({ options, path })),
  buildApiUrl: vi.fn((path: string) => `https://api.example.test${path}`),
  publicApiRequest: vi.fn((path: string, options?: unknown) => Promise.resolve({ options, path })),
}));

vi.mock("@/lib/api", () => apiMocks);

import {
  adminAudienceApi,
  adminContentApi,
  adminDashboardApi,
  adminEmailAccountsApi,
  adminEmailCampaignApi,
  adminLeadApi,
  adminMediaApi,
  adminNotificationsApi,
  adminUsersApi,
  authApi,
  publicContentApi,
  publicLeadApi,
} from "./api-services";

describe("API service wrappers", () => {
  beforeEach(() => {
    apiMocks.adminApiRequest.mockClear();
    apiMocks.authApiRequest.mockClear();
    apiMocks.buildApiUrl.mockClear();
    apiMocks.publicApiRequest.mockClear();
  });

  it("maps auth and public API calls to backend paths", async () => {
    await authApi.login({ email: "admin@example.com", password: "secret" });
    await authApi.logout();
    await authApi.me();

    expect(apiMocks.authApiRequest).toHaveBeenNthCalledWith(1, "/auth/login", {
      body: { email: "admin@example.com", password: "secret" },
      csrf: false,
      method: "POST",
    });
    expect(apiMocks.authApiRequest).toHaveBeenNthCalledWith(2, "/auth/logout", {
      method: "POST",
    });
    expect(apiMocks.authApiRequest).toHaveBeenNthCalledWith(3, "/auth/me");

    await publicContentApi.siteSettings();
    await publicContentApi.home();
    await publicContentApi.portfolio({ category: "seragam", cursor: "", limit: 12 });
    await publicContentApi.facilities();
    await publicContentApi.gallery({ limit: 8, type: "image" });
    await publicContentApi.news({ category: "event", page: 2 });
    await publicContentApi.newsDetail("berita baru/1");
    await publicLeadApi.createInquiry({
      email: "budi@example.com",
      message: "Halo",
      name: "Budi",
      phone: "0812",
    });
    await publicLeadApi.createWhatsAppLead({ name: "Sari", phone: "0898" });

    expect(apiMocks.publicApiRequest).toHaveBeenCalledWith("/public/site-settings");
    expect(apiMocks.publicApiRequest).toHaveBeenCalledWith("/public/home");
    expect(apiMocks.publicApiRequest).toHaveBeenCalledWith(
      "/public/portfolio?category=seragam&limit=12",
    );
    expect(apiMocks.publicApiRequest).toHaveBeenCalledWith("/public/facilities");
    expect(apiMocks.publicApiRequest).toHaveBeenCalledWith("/public/gallery?type=image&limit=8");
    expect(apiMocks.publicApiRequest).toHaveBeenCalledWith("/public/news?category=event&page=2");
    expect(apiMocks.publicApiRequest).toHaveBeenCalledWith("/public/news/berita%20baru%2F1");
    expect(apiMocks.publicApiRequest).toHaveBeenCalledWith("/public/inquiries", {
      body: {
        email: "budi@example.com",
        message: "Halo",
        name: "Budi",
        phone: "0812",
      },
      method: "POST",
    });
    expect(apiMocks.publicApiRequest).toHaveBeenCalledWith("/public/whatsapp-leads", {
      body: { name: "Sari", phone: "0898" },
      method: "POST",
    });
  });

  it("maps admin dashboard, notification, audience, content, media, lead, and user calls", async () => {
    await adminDashboardApi.summary();
    await adminNotificationsApi.list({ limit: 10, q: "pesan", read: "unread" });
    await adminNotificationsApi.unreadCount();
    await adminNotificationsApi.markRead(7);
    await adminNotificationsApi.markAllRead();
    expect(adminNotificationsApi.streamUrl()).toBe(
      "https://api.example.test/admin/notifications/stream",
    );

    await adminAudienceApi.list({ q: "budi", source: "inquiry", status: "active" });
    await adminAudienceApi.preview({ source: "manual" });
    expect(adminAudienceApi.exportUrl({ q: "budi", status: "blocked" })).toBe(
      "https://api.example.test/admin/audience/export.csv?q=budi&status=blocked",
    );

    await adminContentApi.siteSettings();
    await adminContentApi.updateSiteSettings({ brand: "Indobraga" });
    await adminContentApi.list("portfolios", {
      category: "seragam",
      page: 2,
      q: "jaket",
      status: "published",
    });
    await adminContentApi.detail("news", 4);
    await adminContentApi.create("services", { title: "Cutting" });
    await adminContentApi.update("services", 4, { title: "Cutting Baru" });
    await adminContentApi.updateStatus("services", 4, "published");
    await adminContentApi.remove("services", 4);
    await adminContentApi.reorder("services", [{ id: 4, sort_order: 1 }]);

    await adminMediaApi.list({ compression_status: "completed", media_type: "image", q: "logo" });
    await adminMediaApi.detail(5);
    await adminMediaApi.upload(new File(["x"], "logo.png", { type: "image/png" }), {
      alt_text: "Logo",
      caption: "Logo utama",
      usage: "gallery",
    });
    await adminMediaApi.upload(new File(["x"], "plain.png", { type: "image/png" }), {
      usage: "gallery",
    });
    await adminMediaApi.remove(5);
    await adminMediaApi.retry(5);

    await adminLeadApi.inquiries({ q: "budi", status: "new" });
    await adminLeadApi.inquiry(3);
    await adminLeadApi.updateInquiry(3, { status: "contacted" });
    await adminLeadApi.archiveInquiry(3);
    await adminLeadApi.whatsappLeads({ q: "sari", status: "spam" });
    await adminLeadApi.whatsappLead(8);
    await adminLeadApi.updateWhatsAppLead(8, { status: "closed" });
    await adminLeadApi.archiveWhatsAppLead(8);

    await adminUsersApi.list({ limit: 20, role: "admin", search: "dimas", status: "active" });
    await adminUsersApi.detail(9);
    await adminUsersApi.create({ email: "admin@example.com" });
    await adminUsersApi.update(9, { name: "Admin" });
    await adminUsersApi.updateStatus(9, "inactive");
    await adminUsersApi.remove(9);

    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/dashboard");
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith(
      "/admin/notifications?q=pesan&read=unread&limit=10",
    );
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/notifications/unread-count");
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/notifications/7/read", {
      method: "POST",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/notifications/read-all", {
      method: "POST",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith(
      "/admin/audience/contacts?q=budi&source=inquiry&status=active",
    );
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/audience/preview?source=manual");
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/site-settings");
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/site-settings", {
      body: { brand: "Indobraga" },
      method: "PATCH",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith(
      "/admin/portfolios?q=jaket&status=published&category=seragam&page=2",
    );
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/news/4");
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/services", {
      body: { title: "Cutting" },
      method: "POST",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/services/4", {
      body: { title: "Cutting Baru" },
      method: "PATCH",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/services/4/status", {
      body: { status: "published" },
      method: "PATCH",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/services/4", {
      method: "DELETE",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/services/reorder", {
      body: { items: [{ id: 4, sort_order: 1 }] },
      method: "PATCH",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith(
      "/admin/media?q=logo&media_type=image&compression_status=completed",
    );
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/media/5");
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith(
      "/admin/media",
      expect.objectContaining({ body: expect.any(FormData), method: "POST" }),
    );
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/media/5", {
      method: "DELETE",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/media/5/retry", {
      method: "POST",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/inquiries?q=budi&status=new");
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/inquiries/3");
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/inquiries/3", {
      body: { status: "contacted" },
      method: "PATCH",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/inquiries/3", {
      method: "DELETE",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith(
      "/admin/whatsapp-leads?q=sari&status=spam",
    );
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/whatsapp-leads/8");
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/whatsapp-leads/8", {
      body: { status: "closed" },
      method: "PATCH",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/whatsapp-leads/8", {
      method: "DELETE",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith(
      "/admin/users?search=dimas&role=admin&status=active&limit=20",
    );
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/users/9");
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/users", {
      body: { email: "admin@example.com" },
      method: "POST",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/users/9", {
      body: { name: "Admin" },
      method: "PATCH",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/users/9/status", {
      body: { status: "inactive" },
      method: "PATCH",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/users/9", {
      method: "DELETE",
    });
  });

  it("maps admin email account and campaign calls", async () => {
    await adminEmailAccountsApi.list({ provider: "smtp", q: "support", status: "connected" });
    await adminEmailAccountsApi.googleOAuthUrl({ display_name: "Support", email_hint: "a@b.test" });
    const smtpPayload = {
      display_name: "Support",
      email_address: "support@example.com",
      smtp_host: "smtp.example.com",
      smtp_password: "secret",
      smtp_port: 587,
      smtp_security: "starttls" as const,
      smtp_username: "support@example.com",
    };
    await adminEmailAccountsApi.testSmtp(smtpPayload);
    await adminEmailAccountsApi.createSmtp(smtpPayload);
    await adminEmailAccountsApi.update(11, { display_name: "New" });
    await adminEmailAccountsApi.reconnect(11);
    await adminEmailAccountsApi.disable(11);
    await adminEmailAccountsApi.remove(11);

    const campaignPayload = {
      body_text: "Halo",
      email_account_id: 11,
      recipients: [{ email: "a@b.test", name: "A" }],
      subject: "Subjek",
      title: "Kampanye",
    };
    await adminEmailCampaignApi.list({ email_account_id: 11, q: "promo", status: "draft" });
    await adminEmailCampaignApi.detail(15);
    await adminEmailCampaignApi.createDraft(campaignPayload);
    await adminEmailCampaignApi.createDraftFromAudience({
      ...campaignPayload,
      audience_filter: { source: "inquiry", status: "active" },
    });
    await adminEmailCampaignApi.previewInquiryRecipients({
      date_from: "2026-01-01",
      date_to: "2026-02-01",
      q: "budi",
      status: "new",
    });
    await adminEmailCampaignApi.createDraftFromInquiries({
      ...campaignPayload,
      inquiry_filter: { status: "contacted" },
    });
    await adminEmailCampaignApi.update(15, { subject: "Updated" });
    await adminEmailCampaignApi.send(15);
    await adminEmailCampaignApi.recipients(15, { page: 2, q: "a@" });
    await adminEmailCampaignApi.logs(15, { status: "sent" });

    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith(
      "/admin/email-accounts?q=support&provider=smtp&status=connected",
    );
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith(
      "/admin/email-accounts/google/oauth-url",
      {
        body: { display_name: "Support", email_hint: "a@b.test" },
        method: "POST",
      },
    );
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/email-accounts/smtp/test", {
      body: smtpPayload,
      method: "POST",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/email-accounts/smtp", {
      body: smtpPayload,
      method: "POST",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/email-accounts/11", {
      body: { display_name: "New" },
      method: "PATCH",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/email-accounts/11/reconnect", {
      method: "POST",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/email-accounts/11/disable", {
      method: "POST",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/email-accounts/11", {
      method: "DELETE",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith(
      "/admin/email-campaigns?q=promo&status=draft&email_account_id=11",
    );
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/email-campaigns/15");
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/email-campaigns/draft", {
      body: campaignPayload,
      method: "POST",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith(
      "/admin/email-campaigns/draft/from-audience",
      {
        body: { ...campaignPayload, audience_filter: { source: "inquiry", status: "active" } },
        method: "POST",
      },
    );
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith(
      "/admin/email-campaigns/recipient-sources/inquiries/preview?q=budi&status=new&date_from=2026-01-01&date_to=2026-02-01",
    );
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith(
      "/admin/email-campaigns/draft/from-inquiries",
      {
        body: { ...campaignPayload, inquiry_filter: { status: "contacted" } },
        method: "POST",
      },
    );
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/email-campaigns/15", {
      body: { subject: "Updated" },
      method: "PATCH",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith("/admin/email-campaigns/15/send", {
      method: "POST",
    });
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith(
      "/admin/email-campaigns/15/recipients?q=a%40&page=2",
    );
    expect(apiMocks.adminApiRequest).toHaveBeenCalledWith(
      "/admin/email-campaigns/15/logs?status=sent",
    );
  });
});
