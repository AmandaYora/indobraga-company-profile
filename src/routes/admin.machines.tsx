import { createFileRoute } from "@tanstack/react-router";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { Card, PageTitle, PrimaryButton } from "@/components/admin/ui";
import { machines } from "@/data/site";

export const Route = createFileRoute("/admin/machines")({ component: MachineAdminPage });

function MachineAdminPage() {
  return (
    <>
      <PageTitle
        title="Mesin & Fasilitas"
        desc="Daftar mesin, fasilitas produksi, printing, sample, dan kontrol kualitas."
        action={
          <PrimaryButton>
            <Plus className="h-4 w-4" /> Tambah Fasilitas
          </PrimaryButton>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {machines.map((m) => (
          <Card key={m.id} className="flex gap-4 p-4">
            <img src={m.image} alt="" className="h-24 w-24 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-primary">{m.metric}</p>
                  <p className="font-semibold">{m.name}</p>
                </div>
                <div className="flex gap-1">
                  <button className="rounded-md p-1.5 hover:bg-secondary">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="rounded-md p-1.5 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
