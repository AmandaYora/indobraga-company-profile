import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GripVertical, Plus, Trash2, Edit2, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, PageTitle, PrimaryButton } from "@/components/admin/ui";
import { EmptyState, TablePagination, usePagination } from "@/components/admin/Pagination";
import {
  ConfirmDialog,
  CrudModal,
  Field,
  ImageUploadField,
  Select,
  TextInput,
} from "@/components/admin/CrudModal";
import { partners } from "@/data/site";

export const Route = createFileRoute("/admin/partners")({ component: PartnerAdminPage });

type Item = (typeof partners)[number];

function PartnerAdminPage() {
  const [openForm, setOpenForm] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [target, setTarget] = useState<Item | null>(null);
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState("all");

  const filtered = partners.filter(
    (p) =>
      (seg === "all" || p.segment === seg) &&
      (q === "" || p.name.toLowerCase().includes(q.toLowerCase())),
  );
  const pg = usePagination(filtered, 12, `${q}|${seg}`);
  const segments = Array.from(new Set(partners.map((p) => p.segment)));

  const submit = () => {
    setOpenForm(false);
    toast.success(editing ? "Logo klien diperbarui" : "Logo klien ditambahkan");
  };
  const confirmDel = () => {
    setOpenDel(false);
    toast.error("Logo klien dihapus", {
      description: target ? `"${target.name}" telah dihapus.` : undefined,
    });
  };

  return (
    <>
      <PageTitle
        title="Logo Klien"
        desc="Logo dan nama klien untuk bagian dipercaya oleh di website publik."
        action={
          <PrimaryButton onClick={() => { setEditing(null); setOpenForm(true); }}>
            <Plus className="h-4 w-4" /> Tambah Logo
          </PrimaryButton>
        }
      />
      <Card className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama klien..." className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-4 text-sm outline-none focus:border-primary" />
        </div>
        <select value={seg} onChange={(e) => setSeg(e.target.value)} className="rounded-full border border-border bg-secondary px-4 py-2 text-sm">
          <option value="all">Semua Segmen</option>
          {segments.map((s) => <option key={s}>{s}</option>)}
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} dari {partners.length} klien</span>
      </Card>
      <Card className="p-0">
        <div className="p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pg.slice.map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
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
              <div className="flex gap-1">
                <button onClick={() => { setEditing(p); setOpenForm(true); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => { setTarget(p); setOpenDel(true); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <EmptyState title="Tidak ada klien" />}
        </div>
        <TablePagination
          page={pg.page}
          pageCount={pg.pageCount}
          pageSize={pg.pageSize}
          total={pg.total}
          start={pg.start}
          end={pg.end}
          onPageChange={pg.setPage}
          onPageSizeChange={pg.setPageSize}
          itemLabel="klien"
          pageSizeOptions={[12, 24, 48]}
        />
      </Card>

      <CrudModal
        open={openForm}
        onOpenChange={setOpenForm}
        title={editing ? "Ubah Logo Klien" : "Tambah Logo Klien"}
        description="Logo akan ditampilkan pada bagian Dipercaya Oleh di beranda."
        onSubmit={submit}
      >
        <Field label="Nama Klien" required>
          <TextInput defaultValue={editing?.name} placeholder="Contoh: Pertamina" />
        </Field>
        <Field label="Segmen" required>
          <Select defaultValue={editing?.segment ?? "Korporasi"}>
            {["Klub Sepak Bola","Klub Basket","Klub Olahraga","Tim Olahraga","Kebugaran","Merek Olahraga","Pakaian","Tas & Pakaian","Acara","Perhotelan","Korporasi","Transportasi","Perbankan","Energi","Pendidikan"].map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <ImageUploadField label="File Logo" hint="PNG transparan rekomendasi 240x120 px." />
        <Field label="Status">
          <Select defaultValue="active">
            <option value="active">Aktif (tampil)</option>
            <option value="inactive">Tidak Aktif</option>
          </Select>
        </Field>
      </CrudModal>

      <ConfirmDialog
        open={openDel}
        onOpenChange={setOpenDel}
        title={target ? `Hapus logo "${target.name}"?` : "Hapus logo?"}
        onConfirm={confirmDel}
      />
    </>
  );
}
