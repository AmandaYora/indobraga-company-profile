import { createFileRoute } from "@tanstack/react-router";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { Card, PageTitle, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import { news } from "@/data/site";

export const Route = createFileRoute("/admin/news")({ component: NewsAdminPage });

function NewsAdminPage() {
  return (
    <>
      <PageTitle
        title="Berita"
        desc="Kelola berita dan pembaruan perusahaan."
        action={
          <PrimaryButton>
            <Plus className="h-4 w-4" /> Buat Berita
          </PrimaryButton>
        }
      />

      <div className="grid gap-4 lg:hidden">
        {news.map((n) => (
          <Card key={n.id} className="p-4">
            <div className="flex gap-3">
              <img src={n.thumb} alt="" className="h-20 w-24 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {n.category}
                    </p>
                    <p className="font-semibold">{n.title}</p>
                  </div>
                  <StatusBadge status="published" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(n.date).toLocaleDateString("id-ID")}
                </p>
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
              <th className="p-4 text-left">Judul</th>
              <th className="p-4 text-left">Kategori</th>
              <th className="p-4 text-left">Tanggal</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {news.map((n) => (
              <tr key={n.id} className="hover:bg-secondary/40">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={n.thumb} alt="" className="h-12 w-16 rounded-md object-cover" />
                    <p className="font-semibold">{n.title}</p>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">{n.category}</td>
                <td className="p-4 text-muted-foreground">
                  {new Date(n.date).toLocaleDateString("id-ID")}
                </td>
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
