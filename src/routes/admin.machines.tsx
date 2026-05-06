import { createFileRoute } from "@tanstack/react-router";
import { Edit2, Plus, Trash2, Upload, GripVertical } from "lucide-react";
import { Card, GhostButton, PageTitle, PrimaryButton } from "@/components/admin/ui";
import { machines, printingCapacity, productionCapacity } from "@/data/site";

export const Route = createFileRoute("/admin/machines")({ component: MachineAdminPage });

function MachineAdminPage() {
  return (
    <>
      <PageTitle
        title="Mesin & Fasilitas"
        desc="Kelola mesin, fasilitas, kapasitas printing (Sublim/Press/DTF), dan kapasitas produksi bulanan."
        action={
          <PrimaryButton>
            <Plus className="h-4 w-4" /> Tambah Fasilitas
          </PrimaryButton>
        }
      />

      {/* Daftar mesin / fasilitas */}
      <h2 className="mb-3 font-display text-base font-bold text-primary-deep">
        Daftar Mesin & Fasilitas
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {machines.map((m) => (
          <Card key={m.id} className="flex gap-4 p-4">
            <label className="group relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-lg">
              <img src={m.image} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/50 group-hover:opacity-100">
                <Upload className="h-5 w-5" />
              </span>
            </label>
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

      {/* Kapasitas Printing */}
      <div className="mt-10 mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold text-primary-deep">
            Kapasitas Printing
          </h2>
          <p className="text-xs text-muted-foreground">
            Tampil di halaman Fasilitas dan Beranda — contoh: Sublim, Press, DTF.
          </p>
        </div>
        <GhostButton>
          <Plus className="h-4 w-4" /> Tambah Item
        </GhostButton>
      </div>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="w-10 p-3" />
              <th className="p-3 text-left">Label</th>
              <th className="p-3 text-left">Nilai</th>
              <th className="p-3 text-left">Satuan</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {printingCapacity.map((p) => (
              <tr key={p.label} className="hover:bg-secondary/40">
                <td className="p-3 text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                </td>
                <td className="p-3">
                  <input
                    defaultValue={p.label}
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                  />
                </td>
                <td className="p-3">
                  <input
                    defaultValue={p.value}
                    className="w-32 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                  />
                </td>
                <td className="p-3">
                  <input
                    defaultValue={p.unit}
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                  />
                </td>
                <td className="p-3 text-right">
                  <button className="rounded-md p-1.5 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end border-t border-border bg-secondary/40 p-3">
          <PrimaryButton>Simpan Perubahan</PrimaryButton>
        </div>
      </Card>

      {/* Kapasitas Produksi */}
      <div className="mt-10 mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold text-primary-deep">
            Kapasitas Produksi Bulanan
          </h2>
          <p className="text-xs text-muted-foreground">
            Daftar produk dan kapasitas pcs/bulan — contoh: Jackets, T-shirts, Backpack.
          </p>
        </div>
        <GhostButton>
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
            {productionCapacity.map((p) => (
              <tr key={p.product} className="hover:bg-secondary/40">
                <td className="p-3 text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                </td>
                <td className="p-3">
                  <input
                    defaultValue={p.product}
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                  />
                </td>
                <td className="p-3">
                  <input
                    defaultValue={p.value}
                    className="w-32 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                  />
                </td>
                <td className="p-3">
                  <input
                    defaultValue={p.unit}
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                  />
                </td>
                <td className="p-3 text-right">
                  <button className="rounded-md p-1.5 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end border-t border-border bg-secondary/40 p-3">
          <PrimaryButton>Simpan Perubahan</PrimaryButton>
        </div>
      </Card>
    </>
  );
}
