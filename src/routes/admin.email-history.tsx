import { createFileRoute } from "@tanstack/react-router";
import { Card, PageTitle, StatusBadge } from "@/components/admin/ui";
export const Route = createFileRoute("/admin/email-history")({ component: H });
const camp = [
  { title: "Promo Q2 2026", account: "marketing@indobraga.co.id", total: 1200, sent: 1200, failed: 0, status: "selesai", date: "2026-05-01" },
  { title: "Follow Up Inquiry April", account: "marketing@indobraga.co.id", total: 540, sent: 320, failed: 12, status: "proses", date: "2026-05-04" },
  { title: "Newsletter Mei 2026", account: "info@indobraga.co.id", total: 980, sent: 0, failed: 0, status: "pending", date: "2026-05-04" },
];
function H() {
  return (<><PageTitle title="Email Blast History" desc="Riwayat campaign email blast." /><Card className="overflow-hidden p-0"><table className="w-full text-sm"><thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-4 text-left">Campaign</th><th className="p-4 text-left">Pengirim</th><th className="p-4 text-right">Penerima</th><th className="p-4 text-right">Terkirim</th><th className="p-4 text-right">Gagal</th><th className="p-4 text-left">Status</th><th className="p-4 text-left">Tanggal</th></tr></thead><tbody className="divide-y divide-border">{camp.map((c) => (<tr key={c.title}><td className="p-4 font-semibold">{c.title}</td><td className="p-4 text-muted-foreground">{c.account}</td><td className="p-4 text-right">{c.total}</td><td className="p-4 text-right text-success">{c.sent}</td><td className="p-4 text-right text-destructive">{c.failed}</td><td className="p-4"><StatusBadge status={c.status} /></td><td className="p-4 text-muted-foreground">{new Date(c.date).toLocaleDateString("id-ID")}</td></tr>))}</tbody></table></Card></>);
}
