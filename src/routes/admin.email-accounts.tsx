import { createFileRoute } from "@tanstack/react-router";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { Card, PageTitle, PrimaryButton, StatusBadge } from "@/components/admin/ui";
export const Route = createFileRoute("/admin/email-accounts")({ component: E });
const accounts = [
  { email: "marketing@indobraga.co.id", name: "Marketing", status: "connected", at: "Connected 2 minggu lalu" },
  { email: "info@indobraga.co.id", name: "Info", status: "connected", at: "Connected 1 bulan lalu" },
  { email: "promo@indobraga.co.id", name: "Promo", status: "expired", at: "Expired kemarin" },
];
function E() {
  return (<><PageTitle title="Email Accounts" desc="Akun Google sebagai pengirim email blast." action={<PrimaryButton><Plus className="h-4 w-4" /> Hubungkan Akun Google</PrimaryButton>} /><div className="grid gap-4 md:grid-cols-2">{accounts.map((a) => (<Card key={a.email}><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">{a.name[0]}</div><div><p className="font-semibold">{a.email}</p><p className="text-xs text-muted-foreground">{a.name} · {a.at}</p></div></div><StatusBadge status={a.status} /></div><div className="mt-4 flex gap-2"><button className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"><RefreshCw className="h-3.5 w-3.5" /> Reconnect</button><button className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /> Putuskan</button></div></Card>))}</div></>);
}
