import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Edit2, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, PageTitle, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import { EmptyState, TablePagination, usePagination } from "@/components/admin/Pagination";
import {
  ConfirmDialog,
  CrudModal,
  Field,
  ImageUploadField,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/CrudModal";
import { portfolios } from "@/data/site";

export const Route = createFileRoute("/admin/portfolio")({ component: PortfolioAdminPage });

type Item = {
  id: number;
  title: string;
  category: string;
  image: string;
  desc: string;
};

// Data tambahan demo agar pagination terlihat bekerja (frontend mock).
const all: Item[] = [
  ...portfolios.map((p) => ({ ...p })),
  ...Array.from({ length: 18 }).map((_, i) => {
    const base = portfolios[i % portfolios.length];
    return { ...base, id: 100 + i, title: `${base.title} #${i + 1}` };
  }),
];

function PortfolioAdminPage() {
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [target, setTarget] = useState<Item | null>(null);
  const [query, setQuery] = useState("");

  const filtered = all.filter(
    (p) =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase()),
  );
  const pg = usePagination(filtered, 10, query);

  const onAdd = () => {
    setEditing(null);
    setOpenForm(true);
  };
  const onEdit = (p: Item) => {
    setEditing(p);
    setOpenForm(true);
  };
  const onDelete = (p: Item) => {
    setTarget(p);
    setOpenDelete(true);
  };
  const submit = () => {
    setOpenForm(false);
    toast.success(editing ? "Portofolio diperbarui" : "Portofolio ditambahkan", {
      description: "Perubahan akan tampil di website publik setelah disimpan ke server.",
    });
  };
  const confirmDelete = () => {
    setOpenDelete(false);
    toast.error("Portofolio dihapus", {
      description: target ? `"${target.title}" telah dihapus dari daftar.` : undefined,
    });
  };

  return (
    <>
      <PageTitle
        title="Portofolio Produk"
        desc="Kelola katalog hasil produksi untuk website publik."
        action={
          <PrimaryButton onClick={onAdd}>
            <Plus className="h-4 w-4" /> Tambah Produk
          </PrimaryButton>
        }
      />

      <Card className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul / kategori..."
            className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} dari {all.length} produk</span>
      </Card>

      <div className="grid gap-4 lg:hidden">
        {pg.slice.map((p) => (
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
                  <button onClick={() => onEdit(p)} className="rounded-md p-2 hover:bg-secondary">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(p)} className="rounded-md p-2 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
        <TablePagination
          page={pg.page}
          pageCount={pg.pageCount}
          pageSize={pg.pageSize}
          total={pg.total}
          start={pg.start}
          end={pg.end}
          onPageChange={pg.setPage}
          onPageSizeChange={pg.setPageSize}
          itemLabel="produk"
          className="rounded-2xl border bg-card"
        />
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
            {pg.slice.map((p) => (
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
                <td className="p-4"><StatusBadge status="published" /></td>
                <td className="p-4 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => onEdit(p)} className="rounded-md p-2 hover:bg-secondary">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => onDelete(p)} className="rounded-md p-2 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState title="Tidak ada produk" description="Coba kata kunci atau kategori lain." />}
        <TablePagination
          page={pg.page}
          pageCount={pg.pageCount}
          pageSize={pg.pageSize}
          total={pg.total}
          start={pg.start}
          end={pg.end}
          onPageChange={pg.setPage}
          onPageSizeChange={pg.setPageSize}
          itemLabel="produk"
        />
      </Card>

      <CrudModal
        open={openForm}
        onOpenChange={setOpenForm}
        title={editing ? "Ubah Portofolio" : "Tambah Portofolio"}
        description="Lengkapi detail produk untuk ditampilkan di halaman portofolio."
        onSubmit={submit}
        size="lg"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Judul Produk" required>
            <TextInput defaultValue={editing?.title} placeholder="Contoh: Training Jersey Klub" />
          </Field>
          <Field label="Kategori" required>
            <Select defaultValue={editing?.category ?? "Jersey"}>
              {["Jersey","Polo","Kaos","Hoodie","Jaket","Wearpack","Seragam","Tas"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Deskripsi Singkat">
          <TextArea rows={3} defaultValue={editing?.desc} placeholder="Deskripsi muncul di kartu portofolio." />
        </Field>
        <ImageUploadField preview={editing?.image} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Status">
            <Select defaultValue="published">
              <option value="published">Tayang</option>
              <option value="draft">Draf</option>
            </Select>
          </Field>
          <Field label="Urutan Tampil">
            <TextInput type="number" defaultValue={editing?.id ?? 1} />
          </Field>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        title={target ? `Hapus "${target.title}"?` : "Hapus item ini?"}
        description="Produk tidak akan tampil lagi di halaman portofolio publik."
        onConfirm={confirmDelete}
      />
    </>
  );
}
