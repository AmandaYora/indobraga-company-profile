import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, PageTitle, StatusBadge } from "@/components/admin/ui";
import { ConfirmDialog, CrudModal, Field, Select, TextArea } from "@/components/admin/CrudModal";
import { formatDateId } from "@/lib/date";

export const Route = createFileRoute("/admin/inquiries")({ component: I });

type Item = {
  id: number; name: string; email: string; phone: string; message: string; status: string; date: string;
};

const items: Item[] = [
  { id: 1, name: "Budi Santoso", email: "budi@sumbermakmur.co.id", phone: "081234500001", message: "Butuh produksi 2.000 polo shirt seragam.", status: "new", date: "2026-05-04" },
  { id: 2, name: "Nadia Wijaya", email: "nadia@kreasi.id", phone: "081234500002", message: "Ingin pesan hoodie merchandise event 500 pcs.", status: "contacted", date: "2026-05-03" },
  { id: 3, name: "Rangga Aditya", email: "rangga@yayasan.org", phone: "081234500003", message: "Mohon info MOQ wearpack untuk lab.", status: "in_progress", date: "2026-05-02" },
  { id: 4, name: "Lia Permata", email: "lia@indojaya.co.id", phone: "081234500004", message: "Kerjasama jangka panjang seragam.", status: "closed", date: "2026-04-30" },
];

function I() {
  const [openDetail, setOpenDetail] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [active, setActive] = useState<Item | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  const filtered = items.filter((i) =>
    (filter === "all" || i.status === filter) &&
    (q === "" || i.name.toLowerCase().includes(q.toLowerCase()) || i.email.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <>
      <PageTitle title="Pesan Kontak" desc="Daftar pesan dari form kontak di website publik." />

      <Card className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari pengirim / email..." className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-4 text-sm outline-none focus:border-primary" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-full border border-border bg-secondary px-4 py-2 text-sm">
          <option value="all">Semua Status</option>
          <option value="new">Baru</option>
          <option value="contacted">Sudah Dihubungi</option>
          <option value="in_progress">Dalam Proses</option>
          <option value="closed">Selesai</option>
          <option value="spam">Spam</option>
        </select>
      </Card>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4 text-left">Pengirim</th>
              <th className="p-4 text-left">Pesan</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Tanggal</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((i) => (
              <tr key={i.id} className="hover:bg-secondary/40">
                <td className="p-4">
                  <p className="font-semibold">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.email} - {i.phone}</p>
                </td>
                <td className="p-4 max-w-md text-muted-foreground line-clamp-2">{i.message}</td>
                <td className="p-4"><StatusBadge status={i.status} /></td>
                <td className="p-4 text-muted-foreground">{formatDateId(i.date)}</td>
                <td className="p-4 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => { setActive(i); setOpenDetail(true); }} className="rounded-md p-2 hover:bg-secondary"><Eye className="h-4 w-4" /></button>
                    <button onClick={() => { setActive(i); setOpenDel(true); }} className="rounded-md p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">Tidak ada pesan sesuai filter.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <CrudModal
        open={openDetail}
        onOpenChange={setOpenDetail}
        title={active ? `Pesan dari ${active.name}` : "Detail Pesan"}
        description={active ? `${active.email} • ${active.phone}` : undefined}
        onSubmit={() => { setOpenDetail(false); toast.success("Status pesan diperbarui"); }}
        submitLabel="Simpan Perubahan"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Status">
            <Select defaultValue={active?.status}>
              <option value="new">Baru</option>
              <option value="contacted">Sudah Dihubungi</option>
              <option value="in_progress">Dalam Proses</option>
              <option value="closed">Selesai</option>
              <option value="spam">Spam</option>
            </Select>
          </Field>
          <Field label="Penanggung Jawab">
            <Select defaultValue="marketing">
              <option value="marketing">Tim Marketing</option>
              <option value="sales">Tim Sales</option>
              <option value="cs">Customer Service</option>
            </Select>
          </Field>
        </div>
        <Field label="Isi Pesan">
          <div className="rounded-xl bg-secondary p-3 text-sm">{active?.message}</div>
        </Field>
        <Field label="Catatan Internal" hint="Tidak terlihat oleh pengirim.">
          <TextArea rows={3} placeholder="Tindak lanjut, follow-up, dsb." />
        </Field>
      </CrudModal>

      <ConfirmDialog
        open={openDel}
        onOpenChange={setOpenDel}
        title={active ? `Hapus pesan dari ${active.name}?` : "Hapus pesan?"}
        description="Pesan akan dipindahkan ke arsip dan tidak tampil di daftar."
        onConfirm={() => { setOpenDel(false); toast.error("Pesan dihapus"); }}
      />
    </>
  );
}
