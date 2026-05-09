export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type PageList<TItem> = {
  items: TItem[];
  pagination: PaginationMeta;
};

export type CursorList<TItem> = {
  items: TItem[];
  next_cursor: string | null;
  has_more: boolean;
};

export type ApiListParams = {
  page?: number;
  limit?: number;
  q?: string;
  search?: string;
  status?: string;
  category?: string;
  segment?: string;
  type?: string;
  provider?: string;
  media_type?: string;
  compression_status?: string;
  email_account_id?: number;
  cursor?: string | null;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "content_editor";
  permissions: string[];
};

export type ContentStatus = "draft" | "published";

export type PublicSiteSettings = {
  brand: string;
  legal_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  contact_person: string;
  contact_role: string;
  address: string;
  seo: {
    title?: string | null;
    description?: string | null;
    og_image_url?: string | null;
  };
};

export type PublicHome = {
  hero: {
    title: string;
    subtitle?: string | null;
    primary_cta?: { label: string; url?: string | null } | null;
    slides: {
      id: number;
      label?: string | null;
      title: string;
      metric?: string | null;
      image_url?: string | null;
      alt_text?: string | null;
    }[];
  } | null;
  partners: {
    id: number;
    name: string;
    segment?: string | null;
    logo_url?: string | null;
  }[];
  strengths: PublicStrength[];
  featured_portfolios: PublicPortfolioItem[];
  facilities_summary: {
    machines: PublicMachine[];
    printing_capacities: PublicPrintingCapacity[];
    production_capacities: PublicProductionCapacity[];
    services: PublicService[];
  };
  latest_news: PublicNewsItem[];
};

export type PublicStrength = {
  id: number;
  label: string;
  value: string;
  suffix?: string | null;
};

export type PublicPortfolioItem = {
  id: number;
  title: string;
  slug: string;
  category: string;
  thumbnail_url?: string | null;
  medium_url?: string | null;
  alt_text?: string | null;
  short_description?: string | null;
};

export type PublicMachine = {
  id: number;
  name: string;
  slug: string;
  metric?: string | null;
  description?: string | null;
  image_url?: string | null;
  alt_text?: string | null;
};

export type PublicPrintingCapacity = {
  id: number;
  label: string;
  value: string;
  unit: string;
  description?: string | null;
  image_url?: string | null;
  alt_text?: string | null;
};

export type PublicProductionCapacity = {
  id: number;
  product: string;
  value: string;
  unit: string;
};

export type PublicService = {
  id: number;
  name: string;
};

export type PublicFacilities = {
  strengths: PublicStrength[];
  machines: PublicMachine[];
  printing_capacities: PublicPrintingCapacity[];
  production_capacities: PublicProductionCapacity[];
  services: PublicService[];
};

export type PublicGalleryItem = {
  id: number;
  type: "image" | "video";
  thumbnail_url?: string | null;
  media_url?: string | null;
  caption: string;
  alt_text?: string | null;
  published_at?: string | null;
};

export type PublicNewsItem = {
  id: number;
  title: string;
  slug: string;
  category: string;
  thumbnail_url?: string | null;
  excerpt: string;
  published_at?: string | null;
};

export type PublicNewsDetail = PublicNewsItem & {
  content: string[];
  seo: {
    title?: string | null;
    description?: string | null;
    canonical_url?: string | null;
    og_image_url?: string | null;
  };
};

export type AdminContentItem = {
  id: number;
  status?: string;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type AdminMedia = {
  id: number;
  media_type: "image" | "video";
  mime_type: string;
  original_file_name: string;
  compression_status: "processing" | "completed" | "failed" | "deleted";
  file_url?: string | null;
  thumbnail_url?: string | null;
  medium_url?: string | null;
  large_url?: string | null;
  poster_url?: string | null;
  video_url?: string | null;
  width?: number | null;
  height?: number | null;
  duration_seconds?: number | null;
  original_size?: number | null;
  optimized_size?: number | null;
  error?: string | null;
  created_at: string;
  updated_at: string;
};

export type Inquiry = {
  id: number;
  name: string;
  email: string;
  phone: string;
  company?: string | null;
  message: string;
  status: string;
  internal_note?: string | null;
  notification_status?: string | null;
  source?: string | null;
  created_at: string;
  updated_at: string;
};

export type WhatsAppLead = {
  id: number;
  name: string;
  phone: string;
  generated_message: string;
  whatsapp_url: string;
  status: string;
  internal_note?: string | null;
  source?: string | null;
  created_at: string;
  updated_at: string;
};

export type EmailAccount = {
  id: number;
  provider: "google" | "smtp";
  auth_type: "oauth" | "smtp";
  email_address: string;
  display_name: string;
  status: string;
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_security?: string | null;
  smtp_username?: string | null;
  last_validated_at?: string | null;
  connected_at?: string | null;
  last_error?: string | null;
  created_at: string;
  updated_at: string;
};

export type EmailCampaign = {
  id: number;
  title: string;
  subject: string;
  body_text: string;
  body_html?: string | null;
  status: string;
  total_recipients: number;
  queued_count: number;
  sent_count: number;
  failed_count: number;
  started_at?: string | null;
  finished_at?: string | null;
  last_error?: string | null;
  sender_account: {
    id: number;
    provider: string;
    email_address: string;
    display_name: string;
    status: string;
  };
  created_at: string;
  updated_at: string;
};

export type EmailRecipient = {
  id: number;
  campaign_id: number;
  email: string;
  name?: string | null;
  status: string;
  attempts: number;
  next_attempt_at?: string | null;
  sent_at?: string | null;
  failed_at?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
};

export type EmailSendLog = {
  id: number;
  campaign_id: number;
  recipient_id?: number | null;
  recipient_email?: string | null;
  provider: string;
  status: string;
  message_id?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  created_at: string;
};

export type AdminUser = AuthUser & {
  status: "active" | "inactive";
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type DashboardSummary = {
  totals: {
    inquiries: number;
    whatsapp_leads: number;
    published_gallery: number;
    published_news: number;
    active_portfolios: number;
    completed_media: number;
    failed_media: number;
    connected_email_accounts: number;
    email_campaigns: number;
    pending_email_campaigns: number;
    pending_revalidation: number;
  };
  latest_inquiries: Pick<
    Inquiry,
    "id" | "name" | "email" | "phone" | "company" | "status" | "created_at"
  >[];
  latest_whatsapp_leads: Pick<WhatsAppLead, "id" | "name" | "phone" | "status" | "created_at">[];
  latest_email_campaigns: Pick<
    EmailCampaign,
    | "id"
    | "title"
    | "subject"
    | "status"
    | "total_recipients"
    | "sent_count"
    | "failed_count"
    | "created_at"
  >[];
};
