import { Injectable } from "@nestjs/common";
import { ContentStatus, Prisma } from "@prisma/client";
import { PrismaService } from "@/database/prisma.service";

const PER_GROUP_LIMIT = 5;

export type AdminSearchItem = {
  id: number;
  title: string;
  subtitle: string | null;
  /** Admin page that lists/manages this record. */
  to: string;
};

export type AdminSearchGroup = {
  key: string;
  label: string;
  items: AdminSearchItem[];
};

type Row = { id: number; title: string; subtitle: string | null };

const NOT_ARCHIVED = { status: { not: ContentStatus.ARCHIVED } } as const;

function clip(value: string | null | undefined, max = 90): string | null {
  const text = value?.replace(/\s+/g, " ").trim();
  if (!text) {
    return null;
  }

  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

@Injectable()
export class AdminSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(rawQuery: string, permissions: readonly string[]) {
    const q = rawQuery.trim();
    const can = (permission: string) => permissions.includes(permission);
    const tasks: Array<Promise<AdminSearchGroup>> = [];

    if (can("content.read") || can("content.manage")) {
      tasks.push(
        this.group("hero", "Konten Beranda", "/admin/hero", async () => {
          const rows = await this.prisma.heroSection.findMany({
            where: {
              ...NOT_ARCHIVED,
              OR: [{ title: { contains: q } }, { subtitle: { contains: q } }],
            },
            orderBy: { id: "desc" },
            take: PER_GROUP_LIMIT,
          });
          return rows.map((r) => ({ id: r.id, title: r.title, subtitle: clip(r.subtitle) }));
        }),
        this.group("partners", "Logo Klien", "/admin/partners", async () => {
          const rows = await this.prisma.partner.findMany({
            where: {
              ...NOT_ARCHIVED,
              OR: [{ name: { contains: q } }, { segment: { contains: q } }],
            },
            orderBy: { id: "desc" },
            take: PER_GROUP_LIMIT,
          });
          return rows.map((r) => ({ id: r.id, title: r.name, subtitle: clip(r.segment) }));
        }),
        this.group("portfolio", "Portofolio Produk", "/admin/portfolio", async () => {
          const rows = await this.prisma.portfolio.findMany({
            where: {
              ...NOT_ARCHIVED,
              OR: [
                { title: { contains: q } },
                { category: { contains: q } },
                { description: { contains: q } },
              ],
            },
            orderBy: { id: "desc" },
            take: PER_GROUP_LIMIT,
          });
          return rows.map((r) => ({ id: r.id, title: r.title, subtitle: clip(r.category) }));
        }),
        this.group("machines", "Mesin & Fasilitas", "/admin/machines", async () => {
          const rows = await this.prisma.machine.findMany({
            where: { ...NOT_ARCHIVED, name: { contains: q } },
            orderBy: { id: "desc" },
            take: PER_GROUP_LIMIT,
          });
          return rows.map((r) => ({ id: r.id, title: r.name, subtitle: null }));
        }),
        this.group("services", "Daftar Layanan", "/admin/services", async () => {
          const rows = await this.prisma.serviceItem.findMany({
            where: { ...NOT_ARCHIVED, name: { contains: q } },
            orderBy: { id: "desc" },
            take: PER_GROUP_LIMIT,
          });
          return rows.map((r) => ({ id: r.id, title: r.name, subtitle: null }));
        }),
        this.group("gallery", "Galeri Perusahaan", "/admin/gallery", async () => {
          const rows = await this.prisma.galleryItem.findMany({
            where: { ...NOT_ARCHIVED, caption: { contains: q } },
            orderBy: { id: "desc" },
            take: PER_GROUP_LIMIT,
          });
          return rows.map((r) => ({ id: r.id, title: clip(r.caption) ?? "-", subtitle: null }));
        }),
        this.group("news", "Berita", "/admin/news", async () => {
          const rows = await this.prisma.newsArticle.findMany({
            where: {
              ...NOT_ARCHIVED,
              OR: [
                { title: { contains: q } },
                { excerpt: { contains: q } },
                { slug: { contains: q } },
              ],
            },
            orderBy: { id: "desc" },
            take: PER_GROUP_LIMIT,
          });
          return rows.map((r) => ({ id: r.id, title: r.title, subtitle: clip(r.category) }));
        }),
      );
    }

    if (can("leads.read")) {
      const inquiryWhere: Prisma.InquiryWhereInput = {
        archivedAt: null,
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
          { company: { contains: q } },
          { message: { contains: q } },
        ],
      };
      const leadWhere: Prisma.WhatsAppLeadWhereInput = {
        archivedAt: null,
        OR: [{ name: { contains: q } }, { phone: { contains: q } }, { message: { contains: q } }],
      };

      tasks.push(
        this.group("inquiries", "Pesan Kontak", "/admin/inquiries", async () => {
          const rows = await this.prisma.inquiry.findMany({
            where: inquiryWhere,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: PER_GROUP_LIMIT,
          });
          return rows.map((r) => ({ id: r.id, title: r.name, subtitle: clip(r.email) }));
        }),
        this.group("whatsapp", "Prospek WhatsApp", "/admin/whatsapp", async () => {
          const rows = await this.prisma.whatsAppLead.findMany({
            where: leadWhere,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: PER_GROUP_LIMIT,
          });
          return rows.map((r) => ({ id: r.id, title: r.name, subtitle: clip(r.phone) }));
        }),
      );
    }

    const groups = (await Promise.all(tasks)).filter((group) => group.items.length > 0);

    return {
      query: q,
      total: groups.reduce((sum, group) => sum + group.items.length, 0),
      groups,
    };
  }

  private async group(
    key: string,
    label: string,
    to: string,
    load: () => Promise<Row[]>,
  ): Promise<AdminSearchGroup> {
    const rows = await load();

    return { key, label, items: rows.map((row) => ({ ...row, to })) };
  }
}
