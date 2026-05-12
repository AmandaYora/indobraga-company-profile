import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ErrorState, LoadingState, PublicErrorState } from "@/components/admin/ApiState";
import { EmptyState, TablePagination } from "@/components/admin/Pagination";
import { Card, GhostButton, PageTitle, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import { PageHero } from "@/components/public/PageHero";
import {
  fallbackSettings,
  SiteSettingsContext,
  useSiteSettings,
} from "@/components/public/site-settings";
import { ApiClientError } from "@/lib/api";

function html(element: ReactElement) {
  return renderToStaticMarkup(element);
}

describe("basic render components", () => {
  it("renders PageHero with and without imagery", () => {
    const withImage = html(
      <PageHero
        kicker="Fasilitas"
        title="Produksi Garment"
        subtitle="Kapasitas produksi modern"
        image="/factory.jpg"
      />,
    );

    expect(withImage).toContain("Fasilitas");
    expect(withImage).toContain("Produksi Garment");
    expect(withImage).toContain("Kapasitas produksi modern");
    expect(withImage.match(/factory\.jpg/g)?.length ?? 0).toBeGreaterThanOrEqual(2);

    const withoutImage = html(
      <PageHero kicker="Berita" title="Info Terbaru" subtitle="Kabar perusahaan" />,
    );
    expect(withoutImage).toContain("Info Terbaru");
    expect(withoutImage).not.toContain("<img");
  });

  it("renders API loading and error states", () => {
    expect(html(<LoadingState />)).toContain("Memuat data...");
    expect(html(<LoadingState label="Memuat pengguna" />)).toContain("Memuat pengguna");

    const apiError = new ApiClientError({
      code: "BAD_REQUEST",
      message: "Payload tidak valid",
    });
    const adminError = html(<ErrorState error={apiError} onRetry={() => undefined} />);
    expect(adminError).toContain("Data gagal dimuat");
    expect(adminError).toContain("Payload tidak valid");
    expect(adminError).toContain("Coba lagi");

    const publicError = html(<PublicErrorState error="unknown" />);
    expect(publicError).toContain("Konten belum dapat dimuat.");
    expect(publicError).toContain("Terjadi kendala saat memuat data.");
    expect(publicError).not.toContain("button");
  });

  it("renders table pagination states", () => {
    const empty = html(
      <TablePagination
        page={1}
        pageCount={1}
        pageSize={10}
        total={0}
        start={0}
        end={0}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
      />,
    );
    expect(empty).toBe("");

    const compact = html(
      <TablePagination
        page={2}
        pageCount={4}
        pageSize={10}
        total={35}
        start={10}
        end={20}
        itemLabel="konten"
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
      />,
    );
    expect(compact).toContain("Menampilkan");
    expect(compact).toContain("11");
    expect(compact).toContain("35");
    expect(compact).toContain("konten");

    const expanded = html(
      <TablePagination
        page={5}
        pageCount={10}
        pageSize={25}
        total={240}
        start={100}
        end={125}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
      />,
    );
    expect(expanded).toContain("...");
    expect(expanded).toContain("Halaman 5/10");

    expect(html(<EmptyState />)).toContain("Tidak ada data");
    expect(html(<EmptyState title="Kosong" description="Belum ada item" />)).toContain(
      "Belum ada item",
    );
  });

  it("renders admin UI primitives and status labels", () => {
    expect(html(<Card className="extra">Isi</Card>)).toContain("extra");

    const withAction = html(
      <PageTitle
        title="Dashboard"
        desc="Ringkasan operasional"
        action={<PrimaryButton className="save">Simpan</PrimaryButton>}
      />,
    );
    expect(withAction).toContain("Dashboard");
    expect(withAction).toContain("Ringkasan operasional");
    expect(withAction).toContain("Simpan");
    expect(withAction).toContain("save");

    expect(html(<PageTitle title="Tanpa deskripsi" />)).toContain("Tanpa deskripsi");
    expect(html(<StatusBadge status="published" />)).toContain("Tayang");
    expect(html(<StatusBadge status="needs_reconnect" />)).toContain("Perlu Hubungkan Ulang");
    expect(html(<StatusBadge status="custom_status" />)).toContain("custom status");
    expect(html(<GhostButton className="ghost">Batal</GhostButton>)).toContain("ghost");
  });

  it("provides fallback and contextual public site settings", () => {
    function BrandName() {
      return <span>{useSiteSettings().brand}</span>;
    }

    expect(fallbackSettings.brand).toBe("Indobraga");
    expect(html(<BrandName />)).toContain("Indobraga");
    expect(
      html(
        <SiteSettingsContext.Provider value={{ ...fallbackSettings, brand: "Braga Test" }}>
          <BrandName />
        </SiteSettingsContext.Provider>,
      ),
    ).toContain("Braga Test");
  });
});
