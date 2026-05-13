import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Eye, Search } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/admin/ApiState";
import { CrudModal } from "@/components/admin/CrudModal";
import { EmptyState, TablePagination } from "@/components/admin/Pagination";
import { Card, PageTitle, StatusBadge } from "@/components/admin/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import type { EmailCampaign } from "@/lib/api-models";
import { adminEmailCampaignApi } from "@/lib/api-services";
import { formatDateId } from "@/lib/date";

export const Route = createFileRoute("/admin/email-history")({ component: EmailHistoryPage });

function EmailHistoryPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<EmailCampaign | null>(null);
  const loadCampaigns = useCallback(
    () =>
      adminEmailCampaignApi.list({
        page,
        limit: pageSize,
        q: query,
        status: status === "all" ? undefined : status,
      }),
    [page, pageSize, query, status],
  );
  const campaigns = useApiQuery(
    ["admin", "email-campaigns", page, pageSize, query, status],
    loadCampaigns,
  );
  const loadRecipients = useCallback(
    () =>
      selected
        ? adminEmailCampaignApi.recipients(selected.id, { limit: 10 })
        : Promise.resolve({
            items: [],
            pagination: { page: 1, limit: 10, total: 0, total_pages: 1 },
          }),
    [selected],
  );
  const recipients = useApiQuery(["campaign-recipients", selected?.id], loadRecipients, {
    enabled: Boolean(selected),
  });
  const loadLogs = useCallback(
    () =>
      selected
        ? adminEmailCampaignApi.logs(selected.id, { limit: 10 })
        : Promise.resolve({
            items: [],
            pagination: { page: 1, limit: 10, total: 0, total_pages: 1 },
          }),
    [selected],
  );
  const logs = useApiQuery(["campaign-logs", selected?.id], loadLogs, {
    enabled: Boolean(selected),
  });
  const list = campaigns.data?.items ?? [];
  const pagination = campaigns.data?.pagination;
  const start =
    pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const end = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  useEffect(() => {
    setPage(1);
  }, [pageSize, query, status]);

  return (
    <>
      <PageTitle
        title="Riwayat Email Massal"
        desc="Pantau email yang sudah dibuat, penerima, dan hasil pengirimannya."
      />
      <Card className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-full sm:basis-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama pengiriman..."
            className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="max-w-full rounded-full border border-border bg-secondary px-4 py-2 text-sm"
        >
          <option value="all">Semua Status</option>
          <option value="draft">Draf</option>
          <option value="pending">Menunggu</option>
          <option value="processing">Mengirim</option>
          <option value="completed">Selesai</option>
          <option value="failed">Gagal</option>
        </select>
      </Card>
      {campaigns.loading && !campaigns.data && <LoadingState label="Memuat riwayat email..." />}
      {campaigns.error && <ErrorState error={campaigns.error} onRetry={campaigns.reload} />}

      <div className="grid gap-3 lg:hidden">
        {list.length === 0 && !campaigns.loading && (
          <Card>
            <EmptyState title="Belum ada riwayat email" />
          </Card>
        )}
        {list.map((campaign) => (
          <Card key={campaign.id}>
            <CampaignSummary campaign={campaign} onOpen={() => setSelected(campaign)} />
          </Card>
        ))}
      </div>

      <Card className="hidden overflow-hidden p-0 lg:block">
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
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((campaign) => (
              <tr key={campaign.id}>
                <td className="p-4 font-semibold">{campaign.title}</td>
                <td className="p-4 text-muted-foreground">
                  {campaign.sender_account.email_address}
                </td>
                <td className="p-4 text-right">{campaign.total_recipients}</td>
                <td className="p-4 text-right text-success">{campaign.sent_count}</td>
                <td className="p-4 text-right text-destructive">{campaign.failed_count}</td>
                <td className="p-4">
                  <StatusBadge status={campaign.status} />
                </td>
                <td className="p-4 text-muted-foreground">{formatDateId(campaign.created_at)}</td>
                <td className="p-4 text-right">
                  <button
                    aria-label={`Lihat detail email ${campaign.title}`}
                    title="Lihat detail"
                    onClick={() => setSelected(campaign)}
                    className="rounded-md p-2 hover:bg-secondary"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && !campaigns.loading && <EmptyState title="Belum ada riwayat email" />}
      </Card>
      {pagination && (
        <div className="mt-3">
          <TablePagination
            page={pagination.page}
            pageCount={pagination.total_pages}
            pageSize={pagination.limit}
            total={pagination.total}
            start={start}
            end={end}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="email"
          />
        </div>
      )}

      <CrudModal
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected ? selected.title : "Detail Email"}
        submitLabel="Tutup"
        onSubmit={() => setSelected(null)}
        size="xl"
      >
        {selected && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-none">
              <h3 className="mb-3 font-semibold">Penerima</h3>
              {recipients.loading && (
                <p className="text-sm text-muted-foreground">Memuat penerima...</p>
              )}
              {recipients.data?.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-3 border-b border-border py-2 text-sm last:border-0"
                >
                  <span className="text-anywhere">
                    {item.name ? `${item.name} - ${item.email}` : item.email}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </Card>
            <Card className="shadow-none">
              <h3 className="mb-3 font-semibold">Log Pengiriman</h3>
              {logs.loading && <p className="text-sm text-muted-foreground">Memuat log...</p>}
              {logs.data?.items.map((item) => (
                <div key={item.id} className="border-b border-border py-2 text-sm last:border-0">
                  <div className="flex justify-between gap-3">
                    <span className="text-anywhere">{item.recipient_email ?? "-"}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  {item.error_message && (
                    <p className="text-anywhere mt-1 text-xs text-destructive">
                      Pengiriman ke alamat ini gagal. Cek alamat email atau akun pengirim.
                    </p>
                  )}
                </div>
              ))}
            </Card>
          </div>
        )}
      </CrudModal>
    </>
  );
}

function CampaignSummary({ campaign, onOpen }: { campaign: EmailCampaign; onOpen: () => void }) {
  return (
    <>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-anywhere font-semibold">{campaign.title}</p>
          <p className="text-anywhere text-xs text-muted-foreground">
            {campaign.sender_account.email_address}
          </p>
          <p className="text-xs text-muted-foreground">{formatDateId(campaign.created_at)}</p>
        </div>
        <div className="shrink-0">
          <StatusBadge status={campaign.status} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-secondary p-2">
          <p className="font-semibold text-foreground">{campaign.total_recipients}</p>
          <p className="text-muted-foreground">Penerima</p>
        </div>
        <div className="rounded-lg bg-success/10 p-2">
          <p className="font-semibold text-success">{campaign.sent_count}</p>
          <p className="text-muted-foreground">Terkirim</p>
        </div>
        <div className="rounded-lg bg-destructive/10 p-2">
          <p className="font-semibold text-destructive">{campaign.failed_count}</p>
          <p className="text-muted-foreground">Gagal</p>
        </div>
      </div>
      <button
        aria-label={`Lihat detail email ${campaign.title}`}
        title="Lihat detail"
        onClick={onOpen}
        className="mt-3 inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
      >
        <Eye className="h-3.5 w-3.5" /> Detail
      </button>
    </>
  );
}
