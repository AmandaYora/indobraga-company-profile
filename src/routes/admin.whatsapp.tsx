import { createFileRoute } from "@tanstack/react-router";
import { Card, PageTitle, StatusBadge } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/whatsapp")({ component: W });

const leads = [
  { id: 1, name: "Andi Pratama", phone: "08123456001", status: "new", date: "2026-05-04 14:32" },
  {
    id: 2,
    name: "Sari Wulandari",
    phone: "08123456002",
    status: "contacted",
    date: "2026-05-04 11:10",
  },
  {
    id: 3,
    name: "Hendra Gunawan",
    phone: "08123456003",
    status: "in_progress",
    date: "2026-05-03 16:45",
  },
  {
    id: 4,
    name: "Maya Anggraini",
    phone: "08123456004",
    status: "closed",
    date: "2026-05-02 09:20",
  },
];

function W() {
  return (
    <>
      <PageTitle
        title="Prospek WhatsApp"
        desc="Pengunjung yang menghubungi melalui tombol WhatsApp."
      />
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4 text-left">Nama</th>
              <th className="p-4 text-left">Nomor</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Waktu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((i) => (
              <tr key={i.id}>
                <td className="p-4 font-semibold">{i.name}</td>
                <td className="p-4 text-muted-foreground">{i.phone}</td>
                <td className="p-4">
                  <StatusBadge status={i.status} />
                </td>
                <td className="p-4 text-muted-foreground">{i.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
