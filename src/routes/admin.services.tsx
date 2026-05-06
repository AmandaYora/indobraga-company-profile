import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Edit2, GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, PageTitle, PrimaryButton } from "@/components/admin/ui";
import {
  ConfirmDialog,
  CrudModal,
  Field,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/CrudModal";
import { EmptyState, TablePagination, usePagination } from "@/components/admin/Pagination";
import { services } from "@/data/site";

export const Route = createFileRoute("/admin/services")({ component: ServicesAdminPage });

type Service = { id: number; name: string; desc?: string; status: "active" | "inactive" };

const all: Service[] = services.map((name, i) => ({
  id: i + 1,
  name,
  desc: "Layanan ditampilkan pada bagian fasilitas dan beranda website publik.",
  status: "active",
}));

function ServicesAdminPage() {
  const [openForm, setOpenForm] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [target, setTarget] = useState<Service | null>(null);
  const [q, setQ] = useState("");

  const filtered = all.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
  const pg = usePagination(filtered, 10, q);

  return (
    <>
      <PageTitle
        title="Daftar Layanan"
        desc="Kelola daftar layanan produksi yang tampil di halaman beranda dan fasilitas."
        action={
          <PrimaryButton onClick={() => { setEditing(null); setOpenForm(true); }}>
            <Plus className="h-4 w-4" /> Tambah Layanan
          </PrimaryButton>
        }
      />
      <Card className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari layanan..."
          className="min-w-[220px] flex-1 rounded-full border border-border bg-secondary px-4 py-2 text-sm outline-none focus:border-primary"
        />
        <span className="text-xs text-muted-foreground">
          {filtered.length} dari {all.length} layanan
        </span>
      </Card>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="w-10 p-3" />
              <th className="p-3 text-left">Nama Layanan</th>
              <th className="p-3 text-left">Deskripsi</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pg.slice.map((s) => (
              <tr key={s.id} className="hover:bg-secondary/40">
                <td className="p-3 text-muted-foreground"><GripVertical className="h-4 w-4" /></td>
                <td className="p-3 font-semibold">{s.name}</td>
                <td className="p-3 max-w-md text-muted-foreground line-clamp-1">{s.desc}</td>
                <td className="p-3 text-xs uppercase tracking-wider text-muted-foreground">{s.status}</td>
                <td className="p-3 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => { setEditing(s); setOpenForm(true); }} className="rounded-md p-1.5 hover:bg-secondary"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => { setTarget(s); setOpenDel(true); }} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState title="Tidak ada layanan" />}
        <TablePagination
          page={pg.page}
          pageCount={pg.pageCount}
          pageSize={pg.pageSize}
          total={pg.total}
          start={pg.start}
          end={pg.end}
          onPageChange={pg.setPage}
          onPageSizeChange={pg.setPageSize}
          itemLabel="layanan"
        />
      </Card>

      <CrudModal
        open={openForm}
        onOpenChange={setOpenForm}
        title={editing ? "Ubah Layanan" : "Tambah Layanan"}
        onSubmit={() => { setOpenForm(false); toast.success(editing ? "Layanan diperbarui" : "Layanan ditambahkan"); }}
      >
        <Field label="Nama Layanan" required>
          <TextInput defaultValue={editing?.name} placeholder="Contoh: Full production package" />
        </Field>
        <Field label="Deskripsi Singkat">
          <TextArea rows={3} defaultValue={editing?.desc} />
        </Field>
        <Field label="Status">
          <Select defaultValue={editing?.status ?? "active"}>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </Select>
        </Field>
      </CrudModal>
      <ConfirmDialog
        open={openDel}
        onOpenChange={setOpenDel}
        title={target ? `Hapus layanan "${target.name}"?` : "Hapus layanan?"}
        onConfirm={() => { setOpenDel(false); toast.error("Layanan dihapus"); }}
      />
    </>
  );
}