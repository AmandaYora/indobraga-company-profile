import { createFileRoute } from "@tanstack/react-router";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { Card, PageTitle, PrimaryButton } from "@/components/admin/ui";
import { printingCapacity, productionCapacity, strengths } from "@/data/site";

export const Route = createFileRoute("/admin/strength")({ component: StrengthAdminPage });

function StrengthAdminPage() {
  return (
    <>
      <PageTitle
        title="Kekuatan Produksi"
        desc="Statistik produksi utama untuk website publik."
        action={
          <PrimaryButton>
            <Plus className="h-4 w-4" /> Tambah Statistik
          </PrimaryButton>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {strengths.map((s) => (
          <Card key={s.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-display text-3xl font-extrabold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.suffix}</p>
              </div>
              <div className="flex gap-1">
                <button className="rounded-md p-2 hover:bg-secondary">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button className="rounded-md p-2 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-display text-lg font-bold">Kapasitas Produksi</h3>
          <div className="mt-4 space-y-3">
            {productionCapacity.map((item) => (
              <div
                key={item.product}
                className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3"
              >
                <span className="text-sm font-semibold">{item.product}</span>
                <span className="font-display text-lg font-extrabold text-primary">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="font-display text-lg font-bold">Kapasitas Printing</h3>
          <div className="mt-4 space-y-3">
            {printingCapacity.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3"
              >
                <span className="text-sm font-semibold">{item.label}</span>
                <span className="font-display text-lg font-extrabold text-primary">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
