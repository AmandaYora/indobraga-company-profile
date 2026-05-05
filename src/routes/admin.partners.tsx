import { createFileRoute } from "@tanstack/react-router";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Card, PageTitle, PrimaryButton } from "@/components/admin/ui";
import { partners } from "@/data/site";

export const Route = createFileRoute("/admin/partners")({ component: PartnerAdminPage });

function PartnerAdminPage() {
  return (
    <>
      <PageTitle
        title="Logo Klien"
        desc="Logo dan nama klien untuk bagian dipercaya oleh di website publik."
        action={
          <PrimaryButton>
            <Plus className="h-4 w-4" /> Tambah Logo
          </PrimaryButton>
        }
      />
      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex h-10 w-24 shrink-0 items-center justify-center rounded-md bg-secondary px-2 font-display text-xs font-bold text-primary-deep">
                  {p.name}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.segment}</p>
                </div>
              </div>
              <button className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
