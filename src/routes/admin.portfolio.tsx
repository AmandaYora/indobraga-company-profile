import { createFileRoute } from "@tanstack/react-router";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { Card, PageTitle, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import { portfolios } from "@/data/site";

export const Route = createFileRoute("/admin/portfolio")({ component: PortfolioAdminPage });

function PortfolioAdminPage() {
  return (
    <>
      <PageTitle
        title="Portofolio Produk"
        desc="Kelola katalog hasil produksi untuk website publik."
        action={
          <PrimaryButton>
            <Plus className="h-4 w-4" /> Tambah Produk
          </PrimaryButton>
        }
      />

      <div className="grid gap-4 lg:hidden">
        {portfolios.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="flex gap-3">
              <img src={p.image} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {p.category}
                    </p>
                    <p className="font-semibold">{p.title}</p>
                  </div>
                  <StatusBadge status="published" />
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.desc}</p>
                <div className="mt-3 flex gap-1">
                  <button className="rounded-md p-2 hover:bg-secondary">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="rounded-md p-2 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="hidden overflow-hidden p-0 lg:block">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4 text-left">Produk</th>
              <th className="p-4 text-left">Kategori</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {portfolios.map((p) => (
              <tr key={p.id} className="hover:bg-secondary/40">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    <div>
                      <p className="font-semibold">{p.title}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{p.desc}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">{p.category}</td>
                <td className="p-4">
                  <StatusBadge status="published" />
                </td>
                <td className="p-4 text-right">
                  <div className="inline-flex gap-1">
                    <button className="rounded-md p-2 hover:bg-secondary">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button className="rounded-md p-2 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
