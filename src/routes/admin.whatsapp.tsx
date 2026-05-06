import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, PageTitle, StatusBadge } from "@/components/admin/ui";
import { ConfirmDialog, CrudModal, Field, Select, TextArea } from "@/components/admin/CrudModal";

export const Route = createFileRoute("/admin/whatsapp")({ component: W });

type Lead = { id: number; name: string; phone: string; status: string; date: string };

const leads: Lead[] = [
  { id: 1, name: "Andi Pratama", phone: "08123456001", status: "new", date: "2026-05-04 14:32" },
  { id: 2, name: "Sari Wulandari", phone: "08123456002", status: "contacted", date: "2026-05-04 11:10" },
  { id: 3, name: "Hendra Gunawan", phone: "08123456003", status: "in_progress", date: "2026-05-03 16:45" },
  { id: 4, name: "Maya Anggraini", phone: "08123456004", status: "closed", date: "2026-05-02 09:20" },
];

function W() {
  const [openDetail, setOpenDetail] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [active, setActive] = useState<Lead | null>(null);

  return (
    <>
      <PageTitle title="Prospek WhatsApp" desc="Pengunjung yang menghubungi melalui tombol WhatsApp." />
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
            {leads.map((i) => (
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
