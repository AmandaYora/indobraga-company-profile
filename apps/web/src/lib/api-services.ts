import { adminApiRequest, authApiRequest, buildApiUrl, publicApiRequest } from "@/lib/api";
import type {
  AdminContentItem,
  AdminMedia,
  AdminNotification,
  AdminUser,
  ApiListParams,
  AudiencePreview,
  AuthUser,
  CursorList,
  DashboardSummary,
  EmailAccount,
  EmailCampaign,
  EmailRecipient,
  EmailSendLog,
  EmailTemplate,
  Inquiry,
  InquiryRecipientPreview,
  MarketingContact,
  PageList,
  PublicFacilities,
  PublicGalleryItem,
  PublicHome,
  PublicNewsDetail,
  PublicNewsItem,
  PublicPortfolioCategory,
  PublicPortfolioItem,
  PublicSiteSettings,
  WhatsAppLead,
} from "@/lib/api-models";

type RequestBody = Record<string, unknown>;

export type LoginPayload = {
  email: string;
  password: string;
};

export type CreateInquiryPayload = {
  name: string;
  email: string;
  phone: string;
  company?: string;
  message: string;
};

export type CreateWhatsAppLeadPayload = {
  name: string;
  phone: string;
  message?: string;
};

export type CampaignRecipientPayload = {
  email: string;
  name?: string;
  variables?: Record<string, string>;
};

export type CampaignDraftPayload = {
  email_account_id: number;
  title: string;
  subject: string;
  body_text: string;
  body_html?: string;
  recipients: CampaignRecipientPayload[];
};

export type AudienceFilterPayload = {
  q?: string;
  source?: "inquiry" | "whatsapp_lead" | "manual_import" | "manual";
  status?: "active" | "unsubscribed" | "blocked";
};

export type CampaignAudienceDraftPayload = Omit<CampaignDraftPayload, "recipients"> & {
  audience_filter: AudienceFilterPayload;
};

export type InquiryRecipientFilterPayload = {
  q?: string;
  status?: "new" | "contacted" | "in_progress" | "closed" | "spam";
  date_from?: string;
  date_to?: string;
};

export type CampaignInquiryDraftPayload = Omit<CampaignDraftPayload, "recipients"> & {
  inquiry_filter: InquiryRecipientFilterPayload;
};

export type EmailTemplatePayload = {
  name: string;
  subject: string;
  content_mode: "text" | "html";
  body_text?: string;
  body_html?: string;
};

export type SmtpAccountPayload = {
  email_address: string;
  display_name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_security: "ssl_tls" | "starttls" | "none";
  smtp_username: string;
  smtp_password: string;
};

export type AdminResource =
  | "hero"
  | "hero-slides"
  | "partners"
  | "production-strengths"
  | "portfolio-categories"
  | "portfolios"
  | "machines"
  | "printing-capacities"
  | "production-capacities"
  | "services"
  | "gallery-items"
  | "news";

export const authApi = {
  login: (body: LoginPayload) =>
    authApiRequest<{ user: AuthUser }>("/auth/login", {
      method: "POST",
      body,
      csrf: false,
    }),
  logout: () => authApiRequest<{ status: string }>("/auth/logout", { method: "POST" }),
  me: () => authApiRequest<{ user: AuthUser }>("/auth/me"),
};

export const publicContentApi = {
  siteSettings: () => publicApiRequest<PublicSiteSettings>("/public/site-settings"),
  home: () => publicApiRequest<PublicHome>("/public/home"),
  portfolio: (params: ApiListParams = {}) =>
    publicApiRequest<CursorList<PublicPortfolioItem>>(
      withQuery(
        "/public/portfolio",
        pickQuery(params, ["category", "category_slug", "cursor", "limit"]),
      ),
    ),
  portfolioCategories: () =>
    publicApiRequest<{ items: PublicPortfolioCategory[] }>("/public/portfolio-categories"),
  facilities: () => publicApiRequest<PublicFacilities>("/public/facilities"),
  gallery: (params: ApiListParams = {}) =>
    publicApiRequest<CursorList<PublicGalleryItem>>(
      withQuery("/public/gallery", pickQuery(params, ["type", "cursor", "limit"])),
    ),
  news: (params: ApiListParams = {}) =>
    publicApiRequest<PageList<PublicNewsItem>>(
      withQuery("/public/news", pickQuery(params, ["category", "page", "limit"])),
    ),
  newsDetail: (slug: string) =>
    publicApiRequest<PublicNewsDetail>(`/public/news/${encodeURIComponent(slug)}`),
};

export const publicLeadApi = {
  createInquiry: (body: CreateInquiryPayload) =>
    publicApiRequest<{ id: number; status: string }>("/public/inquiries", {
      method: "POST",
      body,
    }),
  createWhatsAppLead: (body: CreateWhatsAppLeadPayload) =>
    publicApiRequest<{
      id: number;
      status: string;
      whatsapp_url: string;
      generated_message: string;
    }>("/public/whatsapp-leads", {
      method: "POST",
      body,
    }),
};

export const adminDashboardApi = {
  summary: () => adminApiRequest<DashboardSummary>("/admin/dashboard"),
};

export const adminNotificationsApi = {
  list: (params: ApiListParams & { read?: "all" | "unread" } = {}) =>
    adminApiRequest<PageList<AdminNotification>>(
      withQuery("/admin/notifications", pickQuery(params, ["q", "read", "page", "limit"])),
    ),
  unreadCount: () => adminApiRequest<{ unread_count: number }>("/admin/notifications/unread-count"),
  markRead: (id: number) =>
    adminApiRequest<{ unread_count: number }>(`/admin/notifications/${id}/read`, {
      method: "POST",
    }),
  markAllRead: () =>
    adminApiRequest<{ marked_read: number; unread_count: number }>(
      "/admin/notifications/read-all",
      { method: "POST" },
    ),
  streamUrl: () => buildApiUrl("/admin/notifications/stream"),
};

export const adminAudienceApi = {
  list: (params: ApiListParams & AudienceFilterPayload = {}) =>
    adminApiRequest<PageList<MarketingContact>>(
      withQuery(
        "/admin/audience/contacts",
        pickQuery(params, ["q", "source", "status", "page", "limit"]),
      ),
    ),
  preview: (params: AudienceFilterPayload = {}) =>
    adminApiRequest<AudiencePreview>(
      withQuery("/admin/audience/preview", pickQuery(params, ["q", "source", "status"])),
    ),
  exportUrl: (params: AudienceFilterPayload = {}) =>
    buildApiUrl(
      withQuery("/admin/audience/export.csv", pickQuery(params, ["q", "source", "status"])),
    ),
};

export const adminContentApi = {
  siteSettings: () => adminApiRequest<AdminContentItem>("/admin/site-settings"),
  updateSiteSettings: (body: RequestBody) =>
    adminApiRequest<AdminContentItem>("/admin/site-settings", { method: "PATCH", body }),
  list: <TItem extends AdminContentItem = AdminContentItem>(
    resource: AdminResource,
    params: ApiListParams = {},
  ) =>
    adminApiRequest<PageList<TItem>>(
      withQuery(
        `/admin/${resource}`,
        pickQuery(params, ["q", "status", "category", "segment", "type", "page", "limit"]),
      ),
    ),
  detail: <TItem extends AdminContentItem = AdminContentItem>(
    resource: AdminResource,
    id: number,
  ) => adminApiRequest<TItem>(`/admin/${resource}/${id}`),
  create: <TItem extends AdminContentItem = AdminContentItem>(
    resource: AdminResource,
    body: RequestBody,
  ) => adminApiRequest<TItem>(`/admin/${resource}`, { method: "POST", body }),
  update: <TItem extends AdminContentItem = AdminContentItem>(
    resource: AdminResource,
    id: number,
    body: RequestBody,
  ) => adminApiRequest<TItem>(`/admin/${resource}/${id}`, { method: "PATCH", body }),
  updateStatus: <TItem extends AdminContentItem = AdminContentItem>(
    resource: AdminResource,
    id: number,
    status: string,
  ) =>
    adminApiRequest<TItem>(`/admin/${resource}/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
  archive: <TItem extends AdminContentItem = AdminContentItem>(
    resource: AdminResource,
    id: number,
  ) =>
    adminApiRequest<TItem>(`/admin/${resource}/${id}/archive`, {
      method: "PATCH",
    }),
  unarchive: <TItem extends AdminContentItem = AdminContentItem>(
    resource: AdminResource,
    id: number,
  ) =>
    adminApiRequest<TItem>(`/admin/${resource}/${id}/unarchive`, {
      method: "PATCH",
    }),
  remove: (resource: AdminResource, id: number) =>
    adminApiRequest<{ cleanup_failed_media_count?: number; id: number; status: string }>(
      `/admin/${resource}/${id}`,
      {
        method: "DELETE",
      },
    ),
  reorder: (resource: AdminResource, items: { id: number; sort_order: number }[]) =>
    adminApiRequest<{ status: string }>(`/admin/${resource}/reorder`, {
      method: "PATCH",
      body: { items },
    }),
};

export const adminMediaApi = {
  list: (params: ApiListParams = {}) =>
    adminApiRequest<PageList<AdminMedia>>(
      withQuery(
        "/admin/media",
        pickQuery(params, ["q", "media_type", "compression_status", "page", "limit"]),
      ),
    ),
  detail: (id: number) => adminApiRequest<AdminMedia>(`/admin/media/${id}`),
  upload: (file: File, params: { usage: string; alt_text?: string; caption?: string }) => {
    const body = new FormData();
    body.append("file", file);
    body.append("usage", params.usage);

    if (params.alt_text) {
      body.append("alt_text", params.alt_text);
    }

    if (params.caption) {
      body.append("caption", params.caption);
    }

    return adminApiRequest<AdminMedia>("/admin/media", { method: "POST", body });
  },
  remove: (id: number) =>
    adminApiRequest<{ id: number; status: string }>(`/admin/media/${id}`, { method: "DELETE" }),
  archive: (id: number) =>
    adminApiRequest<AdminMedia>(`/admin/media/${id}/archive`, { method: "PATCH" }),
  unarchive: (id: number) =>
    adminApiRequest<AdminMedia>(`/admin/media/${id}/unarchive`, { method: "PATCH" }),
  retry: (id: number) =>
    adminApiRequest<AdminMedia>(`/admin/media/${id}/retry`, { method: "POST" }),
};

export const adminLeadApi = {
  inquiries: (params: ApiListParams = {}) =>
    adminApiRequest<PageList<Inquiry>>(
      withQuery("/admin/inquiries", pickQuery(params, ["q", "status", "page", "limit"])),
    ),
  inquiry: (id: number) => adminApiRequest<Inquiry>(`/admin/inquiries/${id}`),
  updateInquiry: (id: number, body: RequestBody) =>
    adminApiRequest<Inquiry>(`/admin/inquiries/${id}`, { method: "PATCH", body }),
  archiveInquiry: (id: number) =>
    adminApiRequest<{ id: number; status: string }>(`/admin/inquiries/${id}`, {
      method: "DELETE",
    }),
  whatsappLeads: (params: ApiListParams = {}) =>
    adminApiRequest<PageList<WhatsAppLead>>(
      withQuery("/admin/whatsapp-leads", pickQuery(params, ["q", "status", "page", "limit"])),
    ),
  whatsappLead: (id: number) => adminApiRequest<WhatsAppLead>(`/admin/whatsapp-leads/${id}`),
  updateWhatsAppLead: (id: number, body: RequestBody) =>
    adminApiRequest<WhatsAppLead>(`/admin/whatsapp-leads/${id}`, { method: "PATCH", body }),
  archiveWhatsAppLead: (id: number) =>
    adminApiRequest<{ id: number; status: string }>(`/admin/whatsapp-leads/${id}`, {
      method: "DELETE",
    }),
};

export const adminEmailAccountsApi = {
  list: (params: ApiListParams = {}) =>
    adminApiRequest<PageList<EmailAccount>>(
      withQuery(
        "/admin/email-accounts",
        pickQuery(params, ["q", "provider", "status", "page", "limit"]),
      ),
    ),
  googleOAuthUrl: (body: { email_hint?: string; display_name?: string }) =>
    adminApiRequest<{ authorization_url: string; state_expires_at: string }>(
      "/admin/email-accounts/google/oauth-url",
      { method: "POST", body },
    ),
  testSmtp: (body: SmtpAccountPayload) =>
    adminApiRequest<{ valid: boolean; message: string }>("/admin/email-accounts/smtp/test", {
      method: "POST",
      body,
    }),
  createSmtp: (body: SmtpAccountPayload) =>
    adminApiRequest<EmailAccount>("/admin/email-accounts/smtp", { method: "POST", body }),
  update: (id: number, body: RequestBody) =>
    adminApiRequest<EmailAccount>(`/admin/email-accounts/${id}`, { method: "PATCH", body }),
  reconnect: (id: number) =>
    adminApiRequest<
      | { authorization_url: string; state_expires_at: string }
      | { provider: "smtp"; action: string; message: string }
    >(`/admin/email-accounts/${id}/reconnect`, { method: "POST" }),
  disable: (id: number) =>
    adminApiRequest<EmailAccount>(`/admin/email-accounts/${id}/disable`, { method: "POST" }),
  remove: (id: number) =>
    adminApiRequest<{ id: number; status: string }>(`/admin/email-accounts/${id}`, {
      method: "DELETE",
    }),
};

export const adminEmailCampaignApi = {
  list: (params: ApiListParams = {}) =>
    adminApiRequest<PageList<EmailCampaign>>(
      withQuery(
        "/admin/email-campaigns",
        pickQuery(params, ["q", "status", "email_account_id", "page", "limit"]),
      ),
    ),
  detail: (id: number) => adminApiRequest<EmailCampaign>(`/admin/email-campaigns/${id}`),
  createDraft: (body: CampaignDraftPayload) =>
    adminApiRequest<{ id: number; status: string; total_recipients: number }>(
      "/admin/email-campaigns/draft",
      { method: "POST", body },
    ),
  createDraftFromAudience: (body: CampaignAudienceDraftPayload) =>
    adminApiRequest<{ id: number; status: string; total_recipients: number }>(
      "/admin/email-campaigns/draft/from-audience",
      { method: "POST", body },
    ),
  previewInquiryRecipients: (params: InquiryRecipientFilterPayload = {}) =>
    adminApiRequest<InquiryRecipientPreview>(
      withQuery(
        "/admin/email-campaigns/recipient-sources/inquiries/preview",
        pickQuery(params, ["q", "status", "date_from", "date_to"]),
      ),
    ),
  createDraftFromInquiries: (body: CampaignInquiryDraftPayload) =>
    adminApiRequest<{ id: number; status: string; total_recipients: number }>(
      "/admin/email-campaigns/draft/from-inquiries",
      { method: "POST", body },
    ),
  update: (id: number, body: Partial<CampaignDraftPayload>) =>
    adminApiRequest<EmailCampaign>(`/admin/email-campaigns/${id}`, { method: "PATCH", body }),
  send: (id: number) =>
    adminApiRequest<EmailCampaign>(`/admin/email-campaigns/${id}/send`, { method: "POST" }),
  recipients: (id: number, params: ApiListParams = {}) =>
    adminApiRequest<PageList<EmailRecipient>>(
      withQuery(
        `/admin/email-campaigns/${id}/recipients`,
        pickQuery(params, ["q", "status", "page", "limit"]),
      ),
    ),
  logs: (id: number, params: ApiListParams = {}) =>
    adminApiRequest<PageList<EmailSendLog>>(
      withQuery(
        `/admin/email-campaigns/${id}/logs`,
        pickQuery(params, ["status", "page", "limit"]),
      ),
    ),
};

export const adminEmailTemplateApi = {
  list: (params: ApiListParams = {}) =>
    adminApiRequest<PageList<EmailTemplate>>(
      withQuery("/admin/email-templates", pickQuery(params, ["q", "page", "limit"])),
    ),
  create: (body: EmailTemplatePayload) =>
    adminApiRequest<EmailTemplate>("/admin/email-templates", { method: "POST", body }),
  update: (id: number, body: Partial<EmailTemplatePayload>) =>
    adminApiRequest<EmailTemplate>(`/admin/email-templates/${id}`, { method: "PATCH", body }),
  remove: (id: number) =>
    adminApiRequest<{ id: number; status: string }>(`/admin/email-templates/${id}`, {
      method: "DELETE",
    }),
};

export const adminUsersApi = {
  list: (params: ApiListParams & { role?: string } = {}) =>
    adminApiRequest<PageList<AdminUser>>(
      withQuery("/admin/users", pickQuery(params, ["search", "role", "status", "page", "limit"])),
    ),
  detail: (id: number) => adminApiRequest<AdminUser>(`/admin/users/${id}`),
  create: (body: RequestBody) =>
    adminApiRequest<AdminUser>("/admin/users", { method: "POST", body }),
  update: (id: number, body: RequestBody) =>
    adminApiRequest<AdminUser>(`/admin/users/${id}`, { method: "PATCH", body }),
  updateStatus: (id: number, status: "active" | "inactive") =>
    adminApiRequest<AdminUser>(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
  remove: (id: number) =>
    adminApiRequest<{ id: number; status: string }>(`/admin/users/${id}`, { method: "DELETE" }),
};

function withQuery(path: string, params: Record<string, unknown>): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    query.set(key, String(value));
  });

  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

function pickQuery<TParams extends Record<string, unknown>>(
  params: TParams,
  keys: string[],
): Record<string, unknown> {
  return keys.reduce<Record<string, unknown>>((result, key) => {
    result[key] = params[key];
    return result;
  }, {});
}
