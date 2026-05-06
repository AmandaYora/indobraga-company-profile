import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, MessageCircle, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, PageTitle, StatusBadge } from "@/components/admin/ui";
import { EmptyState, TablePagination, usePagination } from "@/components/admin/Pagination";
import { ConfirmDialog, CrudModal, Field, Select, TextArea } from "@/components/admin/CrudModal";

export const Route = createFileRoute("/admin/whatsapp")({ component: W });

type Lead = { id: number; name: string; phone: string; status: string; date: string };

const baseLeads: Lead[] = [
  { id: 1, name: "Andi Pratama", phone: "08123456001", status: "new", date: "2026-05-04 14:32" },
  { id: 2, name: "Sari Wulandari", phone: "08123456002", status: "contacted", date: "2026-05-04 11:10" },
  { id: 3, name: "Hendra Gunawan", phone: "08123456003", status: "in_progress", date: "2026-05-03 16:45" },
  { id: 4, name: "Maya Anggraini", phone: "08123456004", status: "closed", date: "2026-05-02 09:20" },
];
const leads: Lead[] = [
  ...baseLeads,
  ...Array.from({ length: 32 }).map((_, i) => {
    const b = baseLeads[i % baseLeads.length];
    return {
      ...b,
      id: 100 + i,
      name: `${b.name.split(" ")[0]} Prospek ${i + 1}`,
      phone: `0812345${String(7000 + i).padStart(4, "0")}`,
      status: ["new", "contacted", "in_progress", "closed"][i % 4],
      date: `2026-04-${String((i % 27) + 1).padStart(2, "0")} 10:00`,
    };
  }),
];

function W() {
  const [openDetail, setOpenDetail] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [active, setActive] = useState<Lead | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = leads.filter(
    (l) =>
      (status === "all" || l.status === status) &&
      (q === "" || l.name.toLowerCase().includes(q.toLowerCase()) || l.phone.includes(q)),
  );
  const pg = usePagination(filtered, 10, `${q}|${status}`);

  return (
    <>
      <PageTitle title="Prospek WhatsApp" desc="Pengunjung yang menghubungi melalui tombol WhatsApp." />
      <Card className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama / nomor..." className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-4 text-sm outline-none focus:border-primary" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-full border border-border bg-secondary px-4 py-2 text-sm">
          <option value="all">Semua Status</option>
          <option value="new">Baru</option>
          <option value="contacted">Sudah Dihubungi</option>
          <option value="in_progress">Dalam Proses</option>
          <option value="closed">Selesai</option>
        </select>
      </Card>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4 text-left">Nama</th>
              <th className="p-4 text-left">Nomor</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Waktu</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pg.slice.map((i) => (
              <tr key={i.id}>
                <td className="p-4 font-semibold">{i.name}</td>
                <td className="p-4 text-muted-foreground">{i.phone}</td>
                <td className="p-4"><StatusBadge status={i.status} /></td>
                <td className="p-4 text-muted-foreground">{i.date}</td>
                <td className="p-4 text-right">
                  <div className="inline-flex gap-1">
                    <a href={`https://wa.me/${i.phone}`} target="_blank" rel="noreferrer" className="rounded-md p-2 text-success hover:bg-success/10"><MessageCircle className="h-4 w-4" /></a>
                    <button onClick={() => { setActive(i); setOpenDetail(true); }} className="rounded-md p-2 hover:bg-secondary"><Eye className="h-4 w-4" /></button>
                    <button onClick={() => { setActive(i); setOpenDel(true); }} className="rounded-md p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState title="Tidak ada prospek" />}
        <TablePagination
          page={pg.page}
          pageCount={pg.pageCount}
          pageSize={pg.pageSize}
          total={pg.total}
          start={pg.start}
          end={pg.end}
          onPageChange={pg.setPage}
          onPageSizeChange={pg.setPageSize}
          itemLabel="prospek"
        />
      </Card>

      <CrudModal
        open={openDetail}
        onOpenChange={setOpenDetail}
        title={active ? `Prospek: ${active.name}` : "Detail Prospek"}
        description={active?.phone}
        onSubmit={() => { setOpenDetail(false); toast.success("Status prospek diperbarui"); }}
      >
        <Field label="Status">
          <Select defaultValue={active?.status}>
            <option value="new">Baru</option>
            <option value="contacted">Sudah Dihubungi</option>
            <option value="in_progress">Dalam Proses</option>
            <option value="closed">Selesai</option>
          </Select>
        </Field>
        <Field label="Catatan Tindak Lanjut">
          <TextArea rows={3} placeholder="Hasil follow-up via WhatsApp..." />
        </Field>
      </CrudModal>

      <ConfirmDialog
        open={openDel}
        onOpenChange={setOpenDel}
        title={active ? `Hapus prospek ${active.name}?` : "Hapus prospek?"}
        onConfirm={() => { setOpenDel(false); toast.error("Prospek dihapus"); }}
      />
    </>
  );
}
