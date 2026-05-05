import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Card, PageTitle, PrimaryButton } from "@/components/admin/ui";
import { partners } from "@/data/site";
export const Route = createFileRoute("/admin/partners")({ component: P });
function P() {
  return (<><PageTitle title="Partner Logos" desc="Logo perusahaan partner di section trusted by." action={<PrimaryButton><Plus className="h-4 w-4" /> Tambah Partner</PrimaryButton>} /><Card><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{partners.map((p) => (<div key={p} className="flex items-center justify-between rounded-xl border border-border bg-card p-3"><div className="flex items-center gap-3"><GripVertical className="h-4 w-4 text-muted-foreground" /><div className="flex h-10 w-20 items-center justify-center rounded-md bg-secondary font-display text-sm font-bold text-primary-deep">{p}</div><span className="text-sm font-medium">{p}</span></div><button className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div>))}</div></Card></>);
}
