import { createFileRoute } from "@tanstack/react-router";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Card, PageTitle, PrimaryButton } from "@/components/admin/ui";
import { strengths } from "@/data/site";
export const Route = createFileRoute("/admin/strength")({ component: S });
function S() {
  return (<><PageTitle title="Production Strength" desc="Statistik kekuatan produksi." action={<PrimaryButton><Plus className="h-4 w-4" /> Tambah Statistik</PrimaryButton>} /><div className="grid gap-4 sm:grid-cols-2">{strengths.map((s) => (<Card key={s.label}><div className="flex items-start justify-between"><div><p className="text-xs text-muted-foreground">{s.label}</p><p className="font-display text-3xl font-extrabold text-primary">{s.value}</p><p className="text-xs text-muted-foreground">{s.suffix}</p></div><div className="flex gap-1"><button className="rounded-md p-2 hover:bg-secondary"><Edit2 className="h-4 w-4" /></button><button className="rounded-md p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button></div></div></Card>))}</div></>);
}
