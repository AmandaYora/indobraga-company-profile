import { createFileRoute } from "@tanstack/react-router";
import { Factory, Inbox, MessageCircle, Newspaper, Package, Printer } from "lucide-react";
import { Card, PageTitle, StatusBadge } from "@/components/admin/ui";
import { partners, portfolios } from "@/data/site";

export const Route = createFileRoute("/admin/")({ component: DashboardPage });

const stats = [
  {
    label: "Total Pesan Kontak",
    value: "128",
    change: "+12%",
    icon: Inbox,
    color: "bg-primary/10 text-primary",
  },
  {
    label: "Prospek WhatsApp",
    value: "84",
    change: "+8%",
    icon: MessageCircle,
    color: "bg-success/15 text-success",
  },
  {
    label: "Berita Tayang",
    value: "3",
    change: "Aktif",
    icon: Newspaper,
    color: "bg-accent/20 text-accent-foreground",
  },
  {
    label: "Portofolio Aktif",
    value: `${portfolios.length}`,
    change: "Sesuai company profile",
    icon: Package,
    color: "bg-warning/20 text-[oklch(0.45_0.15_75)]",
  },
  {
    label: "Kapasitas Produksi",
    value: "90K",
    change: "pcs/bulan",
    icon: Factory,
    color: "bg-primary-soft text-primary",
  },
  {
    label: "Kapasitas Printing",
    value: "12K",
    change: "meter/hari",
    icon: Printer,
    color: "bg-success/15 text-success",
  },
];

const recentInq = [
  { name: "Budi Santoso", company: "PT. Sumber Makmur", status: "new", at: "2 menit lalu" },
  {
    name: "Nadia Wijaya",
    company: "Event Organizer Bandung",
    status: "contacted",
    at: "1 jam lalu",
  },
  { name: "Rangga Aditya", company: "Komunitas Olahraga", status: "in_progress", at: "3 jam lalu" },
  { name: "Lia Permata", company: "Brand Apparel Lokal", status: "closed", at: "Kemarin" },
];

function DashboardPage() {
  return (
    <>
      <PageTitle
        title="Selamat datang kembali"
        desc="Ringkasan aktivitas website Indobraga hari ini."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-2 font-display text-3xl font-extrabold text-primary-deep">
                    {s.value}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-success">{s.change}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Pesan Kontak Terbaru</h3>
            <a className="text-xs font-semibold text-primary" href="/admin/inquiries">
              Lihat semua
            </a>
          </div>
          <ul className="divide-y divide-border">
            {recentInq.map((i) => (
              <li key={i.name} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                    {i.name
                      .split(" ")
                      .map((s) => s[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{i.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={i.status} />
                  <span className="hidden text-xs text-muted-foreground sm:block">{i.at}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="mb-4 font-display text-lg font-bold">Logo Klien</h3>
          <div className="grid grid-cols-2 gap-2">
            {partners.slice(0, 8).map((p) => (
              <div key={p.name} className="rounded-xl bg-secondary px-3 py-2 text-center">
                <p className="truncate text-xs font-bold text-primary-deep">{p.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">{p.segment}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
