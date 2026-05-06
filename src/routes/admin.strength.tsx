import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, PageTitle, PrimaryButton } from "@/components/admin/ui";
import { TablePagination, usePagination } from "@/components/admin/Pagination";
import {
  ConfirmDialog,
  CrudModal,
  Field,
  TextInput,
} from "@/components/admin/CrudModal";
import { printingCapacity, productionCapacity, strengths } from "@/data/site";

export const Route = createFileRoute("/admin/strength")({ component: StrengthAdminPage });

type Item = (typeof strengths)[number];

function StrengthAdminPage() {
  const [openForm, setOpenForm] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [target, setTarget] = useState<Item | null>(null);
  const pg = usePagination(strengths, 8);

  const submit = () => {
    setOpenForm(false);
    toast.success(editing ? "Statistik diperbarui" : "Statistik ditambahkan");
  };
  const confirmDel = () => {
    setOpenDel(false);
    toast.error("Statistik dihapus");
  };

  return (
    <>
      <PageTitle
        title="Kekuatan Produksi"
        desc="Statistik produksi utama untuk website publik."
        action={
          <PrimaryButton onClick={() => { setEditing(null); setOpenForm(true); }}>
            <Plus className="h-4 w-4" /> Tambah Statistik
          </PrimaryButton>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {pg.slice.map((s) => (
          <Card key={s.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-display text-3xl font-extrabold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.suffix}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(s); setOpenForm(true); }} className="rounded-md p-2 hover:bg-secondary">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => { setTarget(s); setOpenDel(true); }} className="rounded-md p-2 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-3">
        <TablePagination
          page={pg.page}
          pageCount={pg.pageCount}
          pageSize={pg.pageSize}
          total={pg.total}
          start={pg.start}
          end={pg.end}
          onPageChange={pg.setPage}
          onPageSizeChange={pg.setPageSize}
          itemLabel="statistik"
          pageSizeOptions={[4, 8, 16]}
          className="rounded-xl border bg-card"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-display text-lg font-bold">Kapasitas Produksi</h3>
          <div className="mt-4 space-y-3">
            {productionCapacity.map((item) => (
              <div key={item.product} className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
                <span className="text-sm font-semibold">{item.product}</span>
                <span className="font-display text-lg font-extrabold text-primary">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="font-display text-lg font-bold">Kapasitas Printing</h3>
          <div className="mt-4 space-y-3">
            {printingCapacity.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
                <span className="text-sm font-semibold">{item.label}</span>
                <span className="font-display text-lg font-extrabold text-primary">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <CrudModal
        open={openForm}
        onOpenChange={setOpenForm}
        title={editing ? "Ubah Statistik" : "Tambah Statistik"}
        description="Kartu statistik tampil di halaman beranda dan fasilitas."
        onSubmit={submit}
      >
        <Field label="Label" required>
          <TextInput defaultValue={editing?.label} placeholder="Contoh: Kapasitas Produksi" />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nilai" required>
            <TextInput defaultValue={editing?.value} placeholder="Contoh: 90K" />
          </Field>
          <Field label="Satuan / Suffix">
            <TextInput defaultValue={editing?.suffix} placeholder="Contoh: pcs / bulan" />
          </Field>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={openDel}
        onOpenChange={setOpenDel}
        title={target ? `Hapus statistik "${target.label}"?` : "Hapus statistik?"}
        onConfirm={confirmDel}
      />
    </>
  );
}
