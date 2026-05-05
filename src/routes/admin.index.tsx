import { createFileRoute } from "@tanstack/react-router";
import { Inbox, MessageCircle, Newspaper, Package, Send, TrendingUp } from "lucide-react";
import { Card, PageTitle, StatusBadge } from "@/components/admin/ui";
export const Route = createFileRoute("/admin/")({ component: D });
const stats = [
  { label: "Total Inquiry", value: "128", change: "+12%", icon: Inbox, color: "bg-primary/10 text-primary" },
  { label: "WhatsApp Leads", value: "84", change: "+8%", icon: MessageCircle, color: "bg-success/15 text-success" },
  { label: "Berita Publish", value: "42", change: "+3", icon: Newspaper, color: "bg-accent/20 text-accent-foreground" },
  { label: "Portfolio Aktif", value: "36", change: "—", icon: Package, color: "bg-warning/20 text-[oklch(0.45_0.15_75)]" },
  { label: "Email Blast Terkirim", value: "1,240", change: "+220", icon: Send, color: "bg-primary-soft text-primary" },
  { label: "Conversion Rate", value: "18.4%", change: "+1.2%", icon: TrendingUp, color: "bg-success/15 text-success" },
];
const recentInq = [
  { name: "Budi Santoso", company: "PT. Sumber Makmur", status: "new", at: "2 menit lalu" },
  { name: "Nadia Wijaya", company: "CV. Kreasi Mandiri", status: "contacted", at: "1 jam lalu" },
  { name: "Rangga Aditya", company: "Yayasan Pendidikan", status: "in_progress", at: "3 jam lalu" },
  { name: "Lia Permata", company: "PT. Indo Jaya", status: "closed", at: "Kemarin" },
];
function D() {
  return (
    <>
      <PageTitle title="Selamat datang kembali 👋" desc="Ringkasan aktivitas website Indobraga hari ini." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => { const Icon = s.icon; return (
          <Card key={s.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-2 font-display text-3xl font-extrabold text-primary-deep">{s.value}</p>
                <p className="mt-1 text-xs font-semibold text-success">{s.change}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color}`}><Icon className="h-5 w-5" /></div>
            </div>
          </Card>
        );})}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between"><h3 className="font-display text-lg font-bold">Inquiry Terbaru</h3><a className="text-xs font-semibold text-primary" href="/admin/inquiries">Lihat semua →</a></div>
          <ul className="divide-y divide-border">
            {recentInq.map((i) => (
              <li key={i.name} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{i.name.split(" ").map((s) => s[0]).join("")}</div>
                  <div><p className="text-sm font-semibold">{i.name}</p><p className="text-xs text-muted-foreground">{i.company}</p></div>
                </div>
                <div className="flex items-center gap-3"><StatusBadge status={i.status} /><span className="hidden text-xs text-muted-foreground sm:block">{i.at}</span></div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="mb-4 font-display text-lg font-bold">Status Email Blast</h3>
          <div className="space-y-3">
            {[{ t: "Promo Q2 2026", s: "selesai", n: "1.200 / 1.200 terkirim" },{ t: "Follow Up Inquiry", s: "proses", n: "320 / 540 terkirim" },{ t: "Newsletter Mei", s: "pending", n: "Menunggu eksekusi" }].map((c) => (
              <div key={c.t} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold">{c.t}</p><StatusBadge status={c.s} /></div>
                <p className="mt-1 text-xs text-muted-foreground">{c.n}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
