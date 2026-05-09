import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Archive, Edit2, Search } from "lucide-react";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "@/components/admin/ApiState";
import { ConfirmDialog, CrudModal, Field, Select, TextArea } from "@/components/admin/CrudModal";
import { EmptyState, TablePagination } from "@/components/admin/Pagination";
import { Card, PageTitle, StatusBadge } from "@/components/admin/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import type { Inquiry, PageList, WhatsAppLead } from "@/lib/api-models";
import { formatDateId } from "@/lib/date";

type Lead = Inquiry | WhatsAppLead;

type LeadManagerProps<TLead extends Lead> = {
  title: string;
  description: string;
  itemLabel: string;
  load: (params: {
    page: number;
    limit: number;
    q?: string;
    status?: string;
  }) => Promise<PageList<TLead>>;
  update: (id: number, body: { status?: string; internal_note?: string }) => Promise<TLead>;
  archive: (id: number) => Promise<{ id: number; status: string }>;
  getContact: (lead: TLead) => ReactNode;
  getMessage: (lead: TLead) => string;
};

export function LeadManager<TLead extends Lead>({
  title,
  description,
  itemLabel,
  load,
  update,
  archive,
  getContact,
  getMessage,
}: LeadManagerProps<TLead>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<TLead | null>(null);
  const [target, setTarget] = useState<TLead | null>(null);
  const [form, setForm] = useState({ status: "new", internal_note: "" });
  const loadLeads = useCallback(
    () =>
      load({
        page,
        limit: pageSize,
        q: query,
        status: status === "all" ? undefined : status,
      }),
    [load, page, pageSize, query, status],
  );
  const leads = useApiQuery([title, page, pageSize, query, status], loadLeads);
  const list = leads.data?.items ?? [];
  const pagination = leads.data?.pagination;
  const start =
    pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const end = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  useEffect(() => {
    setPage(1);
  }, [pageSize, query, status]);

  const openEdit = (lead: TLead) => {
    setEditing(lead);
    setForm({ status: lead.status, internal_note: lead.internal_note ?? "" });
  };

  const submit = async () => {
    if (!editing) {
      return;
    }

    try {
      await update(editing.id, form);
      toast.success(`${itemLabel} diperbarui`);
      setEditing(null);
      leads.reload();
    } catch (error) {
      toast.error("Lead gagal diperbarui", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const confirmArchive = async () => {
    if (!target) {
      return;
    }

    try {
      await archive(target.id);
      toast.success(`${itemLabel} diarsipkan`);
      setTarget(null);
      leads.reload();
    } catch (error) {
      toast.error("Lead gagal diarsipkan", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <>
      <PageTitle title={title} desc={description} />
      <Card className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-full sm:basis-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, kontak, atau pesan..."
            className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="w-full sm:w-56"
        >
          <option value="all">Semua status</option>
          <option value="new">Baru</option>
          <option value="contacted">Sudah Dihubungi</option>
          <option value="in_progress">Dalam Proses</option>
          <option value="closed">Selesai</option>
          <option value="spam">Spam</option>
        </Select>
      </Card>

      {leads.loading && !leads.data && <LoadingState label={`Memuat ${itemLabel}...`} />}
      {leads.error && <ErrorState error={leads.error} onRetry={leads.reload} />}

      <div className="grid gap-4 lg:hidden">
        {list.length === 0 && !leads.loading && (
          <Card>
            <EmptyState title={`Tidak ada ${itemLabel}`} description="Coba filter lain." />
          </Card>
        )}
        {list.map((lead) => (
          <Card key={lead.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-anywhere font-semibold">{lead.name}</p>
                <div className="text-anywhere text-xs text-muted-foreground">
                  {getContact(lead)}
                </div>
              </div>
              <StatusBadge status={lead.status} />
            </div>
            <p className="text-anywhere mt-3 line-clamp-3 text-sm text-muted-foreground">
              {getMessage(lead)}
            </p>
            <LeadActions
              lead={lead}
              onEdit={() => openEdit(lead)}
              onArchive={() => setTarget(lead)}
            />
          </Card>
        ))}
      </div>

      <Card className="hidden overflow-hidden p-0 lg:block">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4 text-left">Lead</th>
              <th className="p-4 text-left">Pesan</th>
              <th className="p-4 text-left">Tanggal</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((lead) => (
              <tr key={lead.id} className="hover:bg-secondary/40">
                <td className="p-4">
                  <p className="font-semibold">{lead.name}</p>
                  <div className="text-xs text-muted-foreground">{getContact(lead)}</div>
                </td>
                <td className="max-w-md p-4">
                  <p className="line-clamp-2 text-muted-foreground">{getMessage(lead)}</p>
                </td>
                <td className="p-4 text-muted-foreground">
                  {formatDateId(lead.created_at, "short")}
                </td>
                <td className="p-4">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="p-4 text-right">
                  <LeadActions
                    lead={lead}
                    onEdit={() => openEdit(lead)}
                    onArchive={() => setTarget(lead)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && !leads.loading && (
          <EmptyState title={`Tidak ada ${itemLabel}`} description="Coba filter lain." />
        )}
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
            itemLabel={itemLabel}
            className="rounded-xl border bg-card"
          />
        </div>
      )}

      <CrudModal
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing ? `Kelola ${editing.name}` : "Kelola lead"}
        description="Status dan catatan internal disimpan ke backend."
        onSubmit={submit}
      >
        <Field label="Status">
          <Select
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="new">Baru</option>
            <option value="contacted">Sudah Dihubungi</option>
            <option value="in_progress">Dalam Proses</option>
            <option value="closed">Selesai</option>
            <option value="spam">Spam</option>
          </Select>
        </Field>
        <Field label="Catatan Internal">
          <TextArea
            rows={4}
            value={form.internal_note}
            onChange={(event) =>
              setForm((current) => ({ ...current, internal_note: event.target.value }))
            }
          />
        </Field>
      </CrudModal>

      <ConfirmDialog
        open={Boolean(target)}
        onOpenChange={(open) => !open && setTarget(null)}
        title={target ? `Arsipkan ${target.name}?` : "Arsipkan lead?"}
        description="Lead tidak akan tampil lagi pada daftar aktif."
        confirmLabel="Arsipkan"
        onConfirm={confirmArchive}
      />
    </>
  );
}

function LeadActions<TLead extends Lead>({
  lead,
  onEdit,
  onArchive,
}: {
  lead: TLead;
  onEdit: () => void;
  onArchive: () => void;
}) {
  return (
    <div className="mt-3 inline-flex gap-1 lg:mt-0">
      <button
        aria-label={`Kelola lead ${lead.name}`}
        title="Kelola"
        onClick={onEdit}
        className="rounded-md p-2 hover:bg-secondary"
      >
        <Edit2 className="h-4 w-4" />
      </button>
      <button
        aria-label={`Arsipkan lead ${lead.name}`}
        title="Arsipkan"
        onClick={onArchive}
        className="rounded-md p-2 text-destructive hover:bg-destructive/10"
      >
        <Archive className="h-4 w-4" />
      </button>
    </div>
  );
}
