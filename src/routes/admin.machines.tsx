import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Edit2, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Card, GhostButton, PageTitle, PrimaryButton } from "@/components/admin/ui";
import { TablePagination, usePagination } from "@/components/admin/Pagination";
import {
  ConfirmDialog,
  CrudModal,
  Field,
  ImageUploadField,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/CrudModal";
import { machines, printingCapacity, productionCapacity } from "@/data/site";

export const Route = createFileRoute("/admin/machines")({ component: MachineAdminPage });

type Machine = (typeof machines)[number];
type Printing = (typeof printingCapacity)[number];
type Production = (typeof productionCapacity)[number];

function MachineAdminPage() {
  const [openMachine, setOpenMachine] = useState(false);
  const [openPrint, setOpenPrint] = useState(false);
  const [openProd, setOpenProd] = useState(false);
  const [openDel, setOpenDel] = useState<{ kind: string; label?: string } | null>(null);
  const [editingM, setEditingM] = useState<Machine | null>(null);
  const [editingP, setEditingP] = useState<Printing | null>(null);
  const [editingProd, setEditingProd] = useState<Production | null>(null);
  const pgM = usePagination(machines, 6);
  const pgP = usePagination(printingCapacity, 5);
  const pgProd = usePagination(productionCapacity, 5);

  return (
    <>
      <PageTitle
        title="Mesin & Fasilitas"
        desc="Kelola mesin, fasilitas, kapasitas printing (Sublim/Press/DTF), dan kapasitas produksi bulanan."
        action={
          <PrimaryButton onClick={() => { setEditingM(null); setOpenMachine(true); }}>
            <Plus className="h-4 w-4" /> Tambah Fasilitas
          </PrimaryButton>
        }
      />

      <h2 className="mb-3 font-display text-base font-bold text-primary-deep">Daftar Mesin & Fasilitas</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {pgM.slice.map((m) => (
          <Card key={m.id} className="flex gap-4 p-4">
            <img src={m.image} alt="" className="h-24 w-24 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-primary">{m.metric}</p>
                  <p className="font-semibold">{m.name}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingM(m); setOpenMachine(true); }} className="rounded-md p-1.5 hover:bg-secondary"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => setOpenDel({ kind: "machine", label: m.name })} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-3">
        <TablePagination
          page={pgM.page}
          pageCount={pgM.pageCount}
          pageSize={pgM.pageSize}
          total={pgM.total}
          start={pgM.start}
          end={pgM.end}
          onPageChange={pgM.setPage}
          onPageSizeChange={pgM.setPageSize}
          itemLabel="mesin"
          pageSizeOptions={[6, 12, 24]}
          className="rounded-xl border bg-card"
        />
      </div>

      {/* Kapasitas Printing */}
      <div className="mt-10 mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold text-primary-deep">Kapasitas Printing</h2>
          <p className="text-xs text-muted-foreground">Tampil di halaman Fasilitas dan Beranda — contoh: Sublim, Press, DTF.</p>
        </div>
        <GhostButton onClick={() => { setEditingP(null); setOpenPrint(true); }}>
          <Plus className="h-4 w-4" /> Tambah Item
        </GhostButton>
      </div>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="w-10 p-3" />
              <th className="w-20 p-3 text-left">Gambar</th>
              <th className="p-3 text-left">Label</th>
              <th className="p-3 text-left">Nilai</th>
              <th className="p-3 text-left">Satuan</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pgP.slice.map((p) => (
              <tr key={p.label} className="hover:bg-secondary/40">
                <td className="p-3 text-muted-foreground"><GripVertical className="h-4 w-4" /></td>
                <td className="p-3"><img src={p.image} alt={p.label} className="h-12 w-12 rounded-lg object-cover" /></td>
                <td className="p-3">
                  <p className="font-semibold">{p.label}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{p.desc}</p>
                </td>
                <td className="p-3 font-semibold text-primary">{p.value}</td>
                <td className="p-3 text-muted-foreground">{p.unit}</td>
                <td className="p-3 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => { setEditingP(p); setOpenPrint(true); }} className="rounded-md p-1.5 hover:bg-secondary"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => setOpenDel({ kind: "printing", label: p.label })} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination
          page={pgP.page}
          pageCount={pgP.pageCount}
          pageSize={pgP.pageSize}
          total={pgP.total}
          start={pgP.start}
          end={pgP.end}
          onPageChange={pgP.setPage}
          onPageSizeChange={pgP.setPageSize}
          itemLabel="kapasitas"
        />
      </Card>

      {/* Kapasitas Produksi */}
      <div className="mt-10 mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold text-primary-deep">Kapasitas Produksi Bulanan</h2>
          <p className="text-xs text-muted-foreground">Daftar produk dan kapasitas pcs/bulan — contoh: Jackets, T-shirts, Backpack.</p>
        </div>
        <GhostButton onClick={() => { setEditingProd(null); setOpenProd(true); }}>
          <Plus className="h-4 w-4" /> Tambah Produk
        </GhostButton>
      </div>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="w-10 p-3" />
              <th className="p-3 text-left">Produk</th>
              <th className="p-3 text-left">Nilai</th>
              <th className="p-3 text-left">Satuan</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pgProd.slice.map((p) => (
              <tr key={p.product} className="hover:bg-secondary/40">
                <td className="p-3 text-muted-foreground"><GripVertical className="h-4 w-4" /></td>
                <td className="p-3 font-semibold">{p.product}</td>
                <td className="p-3 font-semibold text-primary">{p.value}</td>
                <td className="p-3 text-muted-foreground">{p.unit}</td>
                <td className="p-3 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => { setEditingProd(p); setOpenProd(true); }} className="rounded-md p-1.5 hover:bg-secondary"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => setOpenDel({ kind: "production", label: p.product })} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination
          page={pgProd.page}
          pageCount={pgProd.pageCount}
          pageSize={pgProd.pageSize}
          total={pgProd.total}
          start={pgProd.start}
          end={pgProd.end}
          onPageChange={pgProd.setPage}
          onPageSizeChange={pgProd.setPageSize}
          itemLabel="produk"
        />
      </Card>

      {/* Modal: Mesin */}
      <CrudModal
        open={openMachine}
        onOpenChange={setOpenMachine}
        title={editingM ? "Ubah Mesin / Fasilitas" : "Tambah Mesin / Fasilitas"}
        description="Detail mesin akan tampil pada halaman Fasilitas."
        onSubmit={() => { setOpenMachine(false); toast.success(editingM ? "Mesin diperbarui" : "Mesin ditambahkan"); }}
        size="lg"
      >
        <ImageUploadField preview={editingM?.image} />
        <Field label="Nama Mesin" required>
          <TextInput defaultValue={editingM?.name} placeholder="Contoh: Atexco Model X Plus" />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Metric / Kapasitas" required>
            <TextInput defaultValue={editingM?.metric} placeholder="Contoh: 5.000 m/hari" />
          </Field>
          <Field label="Status">
            <Select defaultValue="active">
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </Select>
          </Field>
        </div>
        <Field label="Deskripsi">
          <TextArea rows={3} defaultValue={editingM?.desc} />
        </Field>
      </CrudModal>

      {/* Modal: Printing */}
      <CrudModal
        open={openPrint}
        onOpenChange={setOpenPrint}
        title={editingP ? "Ubah Kapasitas Printing" : "Tambah Kapasitas Printing"}
        onSubmit={() => { setOpenPrint(false); toast.success(editingP ? "Kapasitas printing diperbarui" : "Kapasitas printing ditambahkan"); }}
      >
        <ImageUploadField preview={editingP?.image} />
        <Field label="Label" required>
          <TextInput defaultValue={editingP?.label} placeholder="Contoh: Sublim" />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nilai" required>
            <TextInput defaultValue={editingP?.value} placeholder="Contoh: 5.000" />
          </Field>
          <Field label="Satuan" required>
            <TextInput defaultValue={editingP?.unit} placeholder="meter / hari" />
          </Field>
        </div>
        <Field label="Deskripsi">
          <TextArea rows={2} defaultValue={editingP?.desc} />
        </Field>
      </CrudModal>

      {/* Modal: Production */}
      <CrudModal
        open={openProd}
        onOpenChange={setOpenProd}
        title={editingProd ? "Ubah Kapasitas Produksi" : "Tambah Kapasitas Produksi"}
        onSubmit={() => { setOpenProd(false); toast.success(editingProd ? "Kapasitas produksi diperbarui" : "Kapasitas produksi ditambahkan"); }}
      >
        <Field label="Produk" required>
          <TextInput defaultValue={editingProd?.product} placeholder="Contoh: Jackets" />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nilai" required>
            <TextInput defaultValue={editingProd?.value} placeholder="Contoh: 6.000" />
          </Field>
          <Field label="Satuan" required>
            <TextInput defaultValue={editingProd?.unit ?? "pcs / bulan"} />
          </Field>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={!!openDel}
        onOpenChange={(v) => !v && setOpenDel(null)}
        title={openDel?.label ? `Hapus "${openDel.label}"?` : "Hapus item?"}
        onConfirm={() => {
          toast.error("Item dihapus", { description: openDel?.label });
          setOpenDel(null);
        }}
      />
    </>
  );
}
