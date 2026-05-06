import { createFileRoute } from "@tanstack/react-router";
import { Card, PageTitle, StatusBadge } from "@/components/admin/ui";
import { formatDateId } from "@/lib/date";

export const Route = createFileRoute("/admin/inquiries")({ component: I });

const items = [
  {
    id: 1,
    name: "Budi Santoso",
    email: "budi@sumbermakmur.co.id",
    phone: "081234500001",
    message: "Butuh produksi 2.000 polo shirt seragam.",
    status: "new",
    date: "2026-05-04",
  },
  {
    id: 2,
    name: "Nadia Wijaya",
    email: "nadia@kreasi.id",
    phone: "081234500002",
    message: "Ingin pesan hoodie merchandise event 500 pcs.",
    status: "contacted",
    date: "2026-05-03",
  },
  {
    id: 3,
    name: "Rangga Aditya",
    email: "rangga@yayasan.org",
    phone: "081234500003",
    message: "Mohon info MOQ wearpack untuk lab.",
    status: "in_progress",
    date: "2026-05-02",
  },
  {
    id: 4,
    name: "Lia Permata",
    email: "lia@indojaya.co.id",
    phone: "081234500004",
    message: "Kerjasama jangka panjang seragam.",
    status: "closed",
    date: "2026-04-30",
  },
];

function I() {
  return (
    <>
      <PageTitle title="Pesan Kontak" desc="Daftar pesan dari form kontak di website publik." />
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4 text-left">Pengirim</th>
              <th className="p-4 text-left">Pesan</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Tanggal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((i) => (
              <tr key={i.id} className="hover:bg-secondary/40">
                <td className="p-4">
                  <p className="font-semibold">{i.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.email} - {i.phone}
                  </p>
                </td>
                <td className="p-4 max-w-md text-muted-foreground line-clamp-2">{i.message}</td>
                <td className="p-4">
                  <StatusBadge status={i.status} />
                </td>
                <td className="p-4 text-muted-foreground">{formatDateId(i.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
