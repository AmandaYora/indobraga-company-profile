import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "@/components/admin/ApiState";
import {
  ConfirmDialog,
  CrudModal,
  Field,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/CrudModal";
import { EmptyState, TablePagination } from "@/components/admin/Pagination";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { Card, PageTitle, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import type { AdminContentItem, AdminMedia } from "@/lib/api-models";
import { adminContentApi, adminMediaApi, type AdminResource } from "@/lib/api-services";
import {
  mediaForItem,
  mediaForValue,
  normalizePayload,
  type FieldValue,
  type ResourceField,
} from "./AdminResourceManager.helpers";

export type { ResourceField } from "./AdminResourceManager.helpers";

export type ResourceColumn<TItem extends AdminContentItem> = {
  label: string;
  value: (item: TItem, mediaById: Map<number, AdminMedia>) => ReactNode;
};

export type AdminResourceManagerProps<TItem extends AdminContentItem = AdminContentItem> = {
  resource: AdminResource;
  title: string;
  description: string;
  addLabel: string;
  itemLabel: string;
  fields: ResourceField[];
  columns: ResourceColumn<TItem>[];
  primaryText: (item: TItem) => string;
  secondaryText?: (item: TItem, mediaById: Map<number, AdminMedia>) => ReactNode;
  imageField?: string;
  defaultValues?: Record<string, FieldValue>;
  searchPlaceholder?: string;
};

export function AdminResourceManager<TItem extends AdminContentItem = AdminContentItem>({
  resource,
  title,
  description,
  addLabel,
  itemLabel,
  fields,
  columns,
  primaryText,
  secondaryText,
  imageField,
  defaultValues = {},
  searchPlaceholder = "Cari konten...",
}: AdminResourceManagerProps<TItem>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<TItem | null>(null);
  const [target, setTarget] = useState<TItem | null>(null);
  const [formValues, setFormValues] = useState<Record<string, FieldValue>>({});

  const loadItems = useCallback(
    () =>
      adminContentApi.list<TItem>(resource, {
        page,
        limit: pageSize,
        q: query,
        status: status === "all" ? undefined : status,
      }),
    [page, pageSize, query, resource, status],
  );
  const items = useApiQuery(["admin-resource", resource, page, pageSize, query, status], loadItems);
  const loadMedia = useCallback(() => adminMediaApi.list({ limit: 100 }), []);
  const media = useApiQuery(["admin-media", "resource-preview"], loadMedia);
  const mediaById = useMemo(() => {
    const map = new Map<number, AdminMedia>();
    media.data?.items.forEach((item) => map.set(item.id, item));
    return map;
  }, [media.data]);

  const pagination = items.data?.pagination;
  const list = items.data?.items ?? [];
  const start =
    pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const end = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  const openCreate = () => {
    setEditing(null);
    setFormValues({ status: "draft", ...defaultValues });
    setOpenForm(true);
  };

  const openEdit = (item: TItem) => {
    setEditing(item);
    setFormValues({ ...defaultValues, ...item });
    setOpenForm(true);
  };

  const submit = async () => {
    const body = normalizePayload(formValues, fields);

    try {
      if (editing) {
        await adminContentApi.update(resource, editing.id, body);
      } else {
        await adminContentApi.create(resource, body);
      }

      toast.success(editing ? `${title} diperbarui` : `${title} ditambahkan`);
      setOpenForm(false);
      items.reload();
    } catch (error) {
      toast.error("Perubahan gagal disimpan", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const confirmDelete = async () => {
    if (!target) {
      return;
    }

    try {
      await adminContentApi.remove(resource, target.id);
      toast.success(`${itemLabel} dihapus`);
      setTarget(null);
      items.reload();
    } catch (error) {
      toast.error("Hapus data gagal", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const toggleStatus = async (item: TItem) => {
    const nextStatus = item.status === "published" ? "draft" : "published";

    try {
      await adminContentApi.updateStatus(resource, item.id, nextStatus);
      toast.success(`Status diubah menjadi ${nextStatus === "published" ? "Tayang" : "Draf"}`);
      items.reload();
    } catch (error) {
      toast.error("Status gagal diubah", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  useEffect(() => {
    setPage(1);
  }, [pageSize, query, status]);

  return (
    <>
      <PageTitle
        title={title}
        desc={description}
        action={
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" /> {addLabel}
          </PrimaryButton>
        }
      />

      <Card className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-full sm:basis-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex max-w-full overflow-x-auto rounded-full border border-border bg-secondary p-1 text-xs font-semibold [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { value: "all", label: "Semua" },
            { value: "published", label: "Tayang" },
            { value: "draft", label: "Draf" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value as typeof status)}
              className={`shrink-0 rounded-full px-3 py-1.5 transition ${
                status === option.value
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Card>

      {items.loading && !items.data && <LoadingState label={`Memuat ${itemLabel}...`} />}
      {items.error && <ErrorState error={items.error} onRetry={items.reload} />}

      <div className="grid gap-4 lg:hidden">
        {list.length === 0 && !items.loading && (
          <Card>
            <EmptyState
              title={`Tidak ada ${itemLabel}`}
              description="Coba filter atau kata kunci lain."
            />
          </Card>
        )}
        {list.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex min-w-0 gap-3">
              {imageField && (
                <PreviewImage
                  media={mediaForItem(item, imageField, mediaById)}
                  label={primaryText(item)}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-anywhere font-semibold">{primaryText(item)}</p>
                    {secondaryText && (
                      <div className="text-anywhere mt-1 text-xs text-muted-foreground">
                        {secondaryText(item, mediaById)}
                      </div>
                    )}
                  </div>
                  {item.status && (
                    <div className="shrink-0">
                      <StatusBadge status={item.status} />
                    </div>
                  )}
                </div>
                <ActionButtons
                  label={primaryText(item)}
                  onEdit={() => openEdit(item)}
                  onDelete={() => setTarget(item)}
                  onToggleStatus={() => toggleStatus(item)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="hidden overflow-hidden p-0 lg:block">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {imageField && <th className="w-20 p-4 text-left">Gambar</th>}
              {columns.map((column) => (
                <th key={column.label} className="p-4 text-left">
                  {column.label}
                </th>
              ))}
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((item) => (
              <tr key={item.id} className="hover:bg-secondary/40">
                {imageField && (
                  <td className="p-4">
                    <PreviewImage
                      media={mediaForItem(item, imageField, mediaById)}
                      label={primaryText(item)}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.label} className="p-4 align-top">
                    {column.value(item, mediaById)}
                  </td>
                ))}
                <td className="p-4">{item.status && <StatusBadge status={item.status} />}</td>
                <td className="p-4 text-right">
                  <ActionButtons
                    label={primaryText(item)}
                    onEdit={() => openEdit(item)}
                    onDelete={() => setTarget(item)}
                    onToggleStatus={() => toggleStatus(item)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && !items.loading && (
          <EmptyState
            title={`Tidak ada ${itemLabel}`}
            description="Coba filter atau kata kunci lain."
          />
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
        open={openForm}
        onOpenChange={setOpenForm}
        title={editing ? `Ubah ${itemLabel}` : addLabel}
        description="Data akan disimpan ke backend dan memicu revalidasi konten publik."
        onSubmit={submit}
        size="lg"
      >
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <ResourceInput
              key={field.name}
              field={field}
              value={formValues[field.name]}
              media={mediaForValue(formValues[field.name], mediaById)}
              onChange={(value) =>
                setFormValues((current) => ({
                  ...current,
                  [field.name]: value,
                }))
              }
            />
          ))}
          <Field label="Status">
            <Select
              value={String(formValues.status ?? "draft")}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
            >
              <option value="draft">Draf</option>
              <option value="published">Tayang</option>
            </Select>
          </Field>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={Boolean(target)}
        onOpenChange={(open) => !open && setTarget(null)}
        title={target ? `Hapus "${primaryText(target)}"?` : `Hapus ${itemLabel}?`}
        description="Data akan dihapus dari backend dan tidak tampil lagi pada website publik."
        onConfirm={confirmDelete}
      />
    </>
  );
}

function ResourceInput({
  field,
  value,
  media,
  onChange,
}: {
  field: ResourceField;
  value: FieldValue;
  media?: AdminMedia;
  onChange: (value: FieldValue) => void;
}) {
  if (field.type === "textarea" || field.type === "paragraphs") {
    return (
      <Field
        label={field.label}
        required={field.required}
        hint={field.hint}
        className="md:col-span-2"
      >
        <TextArea
          rows={field.type === "paragraphs" ? 7 : 4}
          value={Array.isArray(value) ? value.join("\n\n") : String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </Field>
    );
  }

  if (field.type === "select") {
    return (
      <Field label={field.label} required={field.required} hint={field.hint}>
        <Select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
          <option value="">Pilih</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>
    );
  }

  if (field.type === "checkbox") {
    return (
      <Field label={field.label} hint={field.hint}>
        <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
          />
          Aktif
        </label>
      </Field>
    );
  }

  if (field.type === "media") {
    return (
      <div className="md:col-span-2">
        <MediaUploadField
          label={field.label}
          usage={field.usage ?? "other"}
          value={typeof value === "number" ? value : undefined}
          previewUrl={media?.thumbnail_url ?? media?.medium_url ?? media?.file_url}
          onUploaded={(uploaded) => onChange(uploaded.id)}
        />
      </div>
    );
  }

  return (
    <Field label={field.label} required={field.required} hint={field.hint}>
      <TextInput
        type={field.type === "number" ? "number" : "text"}
        value={String(value ?? "")}
        placeholder={field.placeholder}
        onChange={(event) =>
          onChange(field.type === "number" ? Number(event.target.value) : event.target.value)
        }
      />
    </Field>
  );
}

function ActionButtons({
  label,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  label: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <div className="mt-3 inline-flex flex-wrap gap-1">
      <button
        aria-label={`Ubah ${label}`}
        title="Ubah"
        onClick={onEdit}
        className="rounded-md p-2 hover:bg-secondary"
      >
        <Edit2 className="h-4 w-4" />
      </button>
      <button
        aria-label={`Ubah status ${label}`}
        title="Ubah status"
        onClick={onToggleStatus}
        className="rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-primary-soft"
      >
        Status
      </button>
      <button
        aria-label={`Hapus ${label}`}
        title="Hapus"
        onClick={onDelete}
        className="rounded-md p-2 text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function PreviewImage({ media, label }: { media?: AdminMedia; label: string }) {
  const src = media?.thumbnail_url ?? media?.medium_url ?? media?.file_url;

  if (!src) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-secondary text-[10px] text-muted-foreground">
        Media
      </div>
    );
  }

  return <img src={src} alt={label} className="h-16 w-16 shrink-0 rounded-lg object-cover" />;
}
