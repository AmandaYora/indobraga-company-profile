import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { Card, PageTitle, StatusBadge } from "@/components/admin/ui";
import { EmptyState, TablePagination, usePagination } from "@/components/admin/Pagination";
import { formatDateId } from "@/lib/date";

export const Route = createFileRoute("/admin/email-history")({ component: H });

const baseCamp = [
  {
    title: "Promo Kuartal 2 2026",
    account: "marketing@indobraga.co.id",
    total: 1200,
    sent: 1200,
    failed: 0,
    status: "selesai",
    date: "2026-05-01",
  },
  {
    title: "Tindak Lanjut Pesan April",
    account: "marketing@indobraga.co.id",
    total: 540,
    sent: 320,
    failed: 12,
    status: "proses",
    date: "2026-05-04",
  },
  {
    title: "Buletin Mei 2026",
    account: "info@indobraga.co.id",
    total: 980,
    sent: 0,
    failed: 0,
    status: "pending",
    date: "2026-05-04",
  },
];
const camp = [
  ...baseCamp,
  ...Array.from({ length: 24 }).map((_, i) => {
    const b = baseCamp[i % baseCamp.length];
    return { ...b, title: `${b.title} #${i + 1}`, total: 200 + i * 30, sent: i * 25, failed: i % 4 };
  }),
];

function H() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = camp.filter(
    (c) => (status === "all" || c.status === status) && (q === "" || c.title.toLowerCase().includes(q.toLowerCase())),
  );
  const pg = usePagination(filtered, 10, `${q}|${status}`);
  return (
    <>
      <PageTitle title="Riwayat Email Massal" desc="Riwayat pengiriman email massal." />
      <Card className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama pengiriman..." className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-4 text-sm outline-none focus:border-primary" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-full border border-border bg-secondary px-4 py-2 text-sm">
          <option value="all">Semua Status</option>
          <option value="selesai">Selesai</option>
          <option value="proses">Diproses</option>
          <option value="pending">Menunggu</option>
        </select>
      </Card>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4 text-left">Nama Pengiriman</th>
              <th className="p-4 text-left">Pengirim</th>
              <th className="p-4 text-right">Penerima</th>
              <th className="p-4 text-right">Terkirim</th>
              <th className="p-4 text-right">Gagal</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Tanggal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pg.slice.map((c) => (
              <tr key={c.title}>
                <td className="p-4 font-semibold">{c.title}</td>
                <td className="p-4 text-muted-foreground">{c.account}</td>
                <td className="p-4 text-right">{c.total}</td>
                <td className="p-4 text-right text-success">{c.sent}</td>
                <td className="p-4 text-right text-destructive">{c.failed}</td>
                <td className="p-4">
                  <StatusBadge status={c.status} />
                </td>
                <td className="p-4 text-muted-foreground">{formatDateId(c.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState title="Belum ada riwayat email" />}
        <TablePagination
          page={pg.page}
          pageCount={pg.pageCount}
          pageSize={pg.pageSize}
          total={pg.total}
          start={pg.start}
          end={pg.end}
          onPageChange={pg.setPage}
          onPageSizeChange={pg.setPageSize}
          itemLabel="kampanye"
        />
      </Card>
    </>
  );
}
