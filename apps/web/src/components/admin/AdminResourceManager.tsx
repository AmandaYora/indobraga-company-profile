import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Archive, Edit2, Eye, EyeOff, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
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
import {
  ActionButtonGroup,
  Card,
  IconActionButton,
  PageTitle,
  PrimaryButton,
  StatusBadge,
} from "@/components/admin/ui";
import { getErrorMessage, useApiQuery } from "@/hooks/use-api-query";
import type { AdminContentItem, AdminMedia } from "@/lib/api-models";
import { adminContentApi, type AdminResource } from "@/lib/api-services";
import {
  mediaPreviewFieldName,
  mediaForItem,
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

type ContentStatusFilter = "active" | "published" | "draft" | "archived";
type ContentConfirmAction = "archive" | "unarchive" | "permanent-delete";
type ContentConfirmation<TItem extends AdminContentItem> = {
  action: ContentConfirmAction;
  item: TItem;
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
  const [status, setStatus] = useState<ContentStatusFilter>("active");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<TItem | null>(null);
  const [confirmation, setConfirmation] = useState<ContentConfirmation<TItem> | null>(null);
  const [formValues, setFormValues] = useState<Record<string, FieldValue>>({});

  const loadItems = useCallback(
    () =>
      adminContentApi.list<TItem>(resource, {
        page,
        limit: pageSize,
        q: query,
        status: status === "active" ? undefined : status,
      }),
    [page, pageSize, query, resource, status],
  );
  const items = useApiQuery(["admin-resource", resource, page, pageSize, query, status], loadItems);
  const mediaById = useMemo(() => new Map<number, AdminMedia>(), []);

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
        description: getErrorMessage(error, { action: "save" }),
      });
    }
  };

  const confirmAction = async () => {
    if (!confirmation) {
      return;
    }

    const { action, item } = confirmation;

    try {
      if (action === "archive") {
        await adminContentApi.archive(resource, item.id);
        toast.success(`${itemLabel} diarsipkan`);
      } else if (action === "unarchive") {
        await adminContentApi.unarchive(resource, item.id);
        toast.success(`${itemLabel} dipulihkan dari arsip`);
      } else {
        const result = await adminContentApi.remove(resource, item.id);
        toast.success(
          result.cleanup_failed_media_count
            ? `${itemLabel} dihapus, beberapa media perlu dibersihkan ulang`
            : `${itemLabel} dihapus`,
        );
      }

      setConfirmation(null);
      items.reload();
    } catch (error) {
      toast.error(contentActionErrorTitle(action), {
        description: getErrorMessage(error, {
          action: action === "permanent-delete" ? "delete" : "save",
        }),
      });
    }
  };

  const toggleStatus = async (item: TItem) => {
    const nextStatus = item.status === "published" ? "draft" : "published";

    try {
      await adminContentApi.updateStatus(resource, item.id, nextStatus);
      toast.success(
        nextStatus === "published" ? "Konten sekarang tayang" : "Konten disimpan sebagai draf",
      );
      items.reload();
    } catch (error) {
      toast.error("Tampilan konten gagal diubah", {
        description: getErrorMessage(error, { action: "save" }),
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
            { value: "active", label: "Aktif" },
            { value: "published", label: "Tayang" },
            { value: "draft", label: "Draf" },
            { value: "archived", label: "Arsip" },
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
                  onArchive={() => setConfirmation({ action: "archive", item })}
                  onUnarchive={() => setConfirmation({ action: "unarchive", item })}
                  onPermanentDelete={() => setConfirmation({ action: "permanent-delete", item })}
                  onToggleStatus={() => toggleStatus(item)}
                  status={item.status}
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
              <th className="p-4 text-left">Tampilan</th>
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
                    onArchive={() => setConfirmation({ action: "archive", item })}
                    onUnarchive={() => setConfirmation({ action: "unarchive", item })}
                    onPermanentDelete={() => setConfirmation({ action: "permanent-delete", item })}
                    onToggleStatus={() => toggleStatus(item)}
                    status={item.status}
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
        description="Perubahan akan tersimpan dan memperbarui tampilan website."
        onSubmit={submit}
        size="lg"
      >
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <ResourceInput
              key={field.name}
              field={field}
              value={formValues[field.name]}
              media={mediaForItem(formValues as AdminContentItem, field.name, mediaById)}
              onChange={(value) =>
                setFormValues((current) => ({
                  ...current,
                  [field.name]: value,
                }))
              }
              onMediaUploaded={(fieldName, uploaded) =>
                setFormValues((current) => ({
                  ...current,
                  [fieldName]: uploaded.id,
                  [mediaPreviewFieldName(fieldName)]: uploaded,
                }))
              }
            />
          ))}
          <Field label="Tampilan Website">
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
        open={Boolean(confirmation)}
        onOpenChange={(open) => !open && setConfirmation(null)}
        title={
          confirmation
            ? contentConfirmTitle(confirmation.action, primaryText(confirmation.item))
            : `${itemLabel}?`
        }
        description={confirmation ? contentConfirmDescription(confirmation.action) : ""}
        confirmLabel={confirmation ? contentConfirmLabel(confirmation.action) : "Lanjutkan"}
        destructive={confirmation?.action === "permanent-delete"}
        onConfirm={confirmAction}
      />
    </>
  );
}

function ResourceInput({
  field,
  value,
  media,
  onChange,
  onMediaUploaded,
}: {
  field: ResourceField;
  value: FieldValue;
  media?: AdminMedia;
  onChange: (value: FieldValue) => void;
  onMediaUploaded: (fieldName: string, media: AdminMedia) => void;
}) {
  if (field.type === "hidden") {
    return null;
  }

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
          <option value="">{field.placeholder ?? "Pilih"}</option>
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
          onUploaded={(uploaded) => {
            onChange(uploaded.id);
            onMediaUploaded(field.name, uploaded);
          }}
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
  onArchive,
  onUnarchive,
  onPermanentDelete,
  onToggleStatus,
  status,
}: {
  label: string;
  onEdit: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onPermanentDelete: () => void;
  onToggleStatus: () => void;
  status?: string;
}) {
  const statusAction = status === "published" ? "Jadikan Draf" : "Tayangkan";

  if (status === "archived") {
    return (
      <ActionButtonGroup className="mt-3 justify-start lg:mt-0 lg:justify-end">
        <IconActionButton
          label={`Pulihkan ${label}`}
          tooltip="Pulihkan"
          onClick={onUnarchive}
          icon={<RotateCcw className="h-4 w-4" />}
          tone="primary"
        />
        <IconActionButton
          label={`Hapus ${label}`}
          tooltip="Hapus"
          onClick={onPermanentDelete}
          icon={<Trash2 className="h-4 w-4" />}
          tone="danger"
        />
      </ActionButtonGroup>
    );
  }

  return (
    <ActionButtonGroup className="mt-3 justify-start lg:mt-0 lg:justify-end">
      <IconActionButton
        label={`Ubah ${label}`}
        tooltip="Ubah"
        onClick={onEdit}
        icon={<Edit2 className="h-4 w-4" />}
      />
      <IconActionButton
        label={`${statusAction} ${label}`}
        tooltip={statusAction}
        onClick={onToggleStatus}
        icon={status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        tone={status === "published" ? "warning" : "success"}
      />
      <IconActionButton
        label={`Arsipkan ${label}`}
        tooltip="Arsipkan"
        onClick={onArchive}
        icon={<Archive className="h-4 w-4" />}
        tone="muted"
      />
      <IconActionButton
        label={`Hapus ${label}`}
        tooltip="Hapus"
        onClick={onPermanentDelete}
        icon={<Trash2 className="h-4 w-4" />}
        tone="danger"
      />
    </ActionButtonGroup>
  );
}

function contentConfirmTitle(action: ContentConfirmAction, label: string) {
  if (action === "archive") {
    return `Arsipkan "${label}"?`;
  }

  if (action === "unarchive") {
    return `Pulihkan "${label}"?`;
  }

  return `Hapus "${label}"?`;
}

function contentConfirmDescription(action: ContentConfirmAction) {
  if (action === "archive") {
    return "Konten ini akan diarsipkan dan tidak tampil lagi di website publik. Anda masih dapat memulihkannya kapan saja.";
  }

  if (action === "unarchive") {
    return "Konten ini akan dipulihkan dari arsip. Periksa kembali status publikasinya sebelum ditampilkan ke website.";
  }

  return "Konten ini akan dihapus dari sistem. Jika konten memiliki file media, file tersebut juga akan dihapus dari penyimpanan media. Aksi ini tidak dapat dibatalkan.";
}

function contentConfirmLabel(action: ContentConfirmAction) {
  if (action === "archive") {
    return "Arsipkan";
  }

  if (action === "unarchive") {
    return "Pulihkan";
  }

  return "Hapus";
}

function contentActionErrorTitle(action: ContentConfirmAction) {
  if (action === "archive") {
    return "Konten gagal diarsipkan";
  }

  if (action === "unarchive") {
    return "Konten gagal dipulihkan";
  }

  return "Konten gagal dihapus";
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
