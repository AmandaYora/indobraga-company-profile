import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (path: string) => (options: { component: () => ReactElement }) => ({
    options,
    path,
  }),
}));

type Column = {
  label: string;
  value: (item: Record<string, unknown>) => ReactNode;
};

type Field = {
  label: string;
  name: string;
  options?: Array<{ label: string; value: string }>;
};

const sampleItem = {
  body: "Isi berita",
  caption: "Dokumentasi produksi",
  category: "seragam",
  company: "PT Contoh",
  content: "Konten",
  cta_label: "Hubungi",
  email: "budi@example.com",
  excerpt: "Ringkasan",
  gallery: [],
  hero_section_id: 1,
  label: "Slide",
  media_type: "image",
  message: "Butuh produksi",
  metric: "1000 pcs",
  name: "Klien",
  phone: "0812",
  segment: "Corporate",
  slug: "contoh",
  sort_order: 3,
  subtitle: "Subtitle",
  title: "Judul Konten",
  year: 2026,
};

vi.mock("@/components/admin/AdminResourceManager", () => ({
  AdminResourceManager: (props: {
    addLabel: string;
    columns: Column[];
    description: string;
    fields: Field[];
    itemLabel: string;
    primaryText?: (item: Record<string, unknown>) => ReactNode;
    resource: string;
    secondaryText?: (item: Record<string, unknown>) => ReactNode;
    title: string;
  }) => (
    <section data-resource={props.resource}>
      <h1>{props.title}</h1>
      <p>{props.description}</p>
      <span>{props.addLabel}</span>
      <span>{props.itemLabel}</span>
      <span>{props.primaryText?.(sampleItem)}</span>
      <span>{props.secondaryText?.(sampleItem)}</span>
      {props.columns.map((column) => (
        <div key={column.label}>
          <strong>{column.label}</strong>
          <span>{column.value(sampleItem)}</span>
        </div>
      ))}
      {props.fields.map((field) => (
        <label key={field.name}>
          {field.label}
          {field.options?.map((option) => (
            <span key={option.value}>{option.label}</span>
          ))}
        </label>
      ))}
    </section>
  ),
}));

vi.mock("@/components/admin/LeadManager", () => ({
  LeadManager: (props: {
    description: string;
    getContact: (lead: Record<string, unknown>) => ReactNode;
    getMessage: (lead: Record<string, unknown>) => ReactNode;
    itemLabel: string;
    title: string;
  }) => (
    <section>
      <h1>{props.title}</h1>
      <p>{props.description}</p>
      <span>{props.itemLabel}</span>
      <span>{props.getContact(sampleItem)}</span>
      <span>{props.getMessage(sampleItem)}</span>
    </section>
  ),
}));

vi.mock("@/components/admin/MediaLibraryPanel", () => ({
  MediaLibraryPanel: () => <aside>Media Library</aside>,
}));

type MockRoute = {
  options: {
    component: () => ReactElement;
  };
  path: string;
};

function renderRoute(route: MockRoute) {
  return renderToStaticMarkup(<route.options.component />);
}

describe("admin resource route configuration", () => {
  it("renders content resource routes through AdminResourceManager", async () => {
    const modules = await Promise.all([
      import("./admin.hero"),
      import("./admin.partners"),
      import("./admin.strength"),
      import("./admin.portfolio"),
      import("./admin.portfolio-categories"),
      import("./admin.machines"),
      import("./admin.services"),
      import("./admin.gallery"),
      import("./admin.news"),
    ]);

    const output = modules.map((module) => renderRoute(module.Route as MockRoute)).join("\n");

    expect(output).toContain("Konten Beranda");
    expect(output).toContain("Slide Hero");
    expect(output).toContain("Logo Klien");
    expect(output).toContain("Kekuatan Produksi");
    expect(output).toContain("Portofolio Produk");
    expect(output).toContain("Kategori Portofolio");
    expect(output).toContain("Mesin &amp; Fasilitas");
    expect(output).toContain("Layanan");
    expect(output).toContain("Galeri Perusahaan");
    expect(output).toContain("Berita");
    expect(output).toContain("Media Library");
    expect(output).toContain("Gambar");
    expect(output).toContain("Video");
    expect(output).toContain("Judul Konten");
  });

  it("renders lead route configuration through LeadManager", async () => {
    const inquiries = await import("./admin.inquiries");
    const whatsapp = await import("./admin.whatsapp");

    const output = [
      renderRoute(inquiries.Route as MockRoute),
      renderRoute(whatsapp.Route as MockRoute),
    ].join("\n");

    expect(output).toContain("Pesan Kontak");
    expect(output).toContain("Prospek WhatsApp");
    expect(output).toContain("budi@example.com - 0812 - PT Contoh");
    expect(output).toContain("Butuh produksi");
  });
});
