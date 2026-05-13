import { useCallback, useState } from "react";
import { Archive, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "@/components/admin/ApiState";
import { ConfirmDialog } from "@/components/admin/CrudModal";
import { EmptyState } from "@/components/admin/Pagination";
import {
  ActionButtonGroup,
  Card,
  IconActionButton,
  PageTitle,
  StatusBadge,
} from "@/components/admin/ui";
import { getErrorMessage, useApiQuery } from "@/hooks/use-api-query";
import type { AdminMedia } from "@/lib/api-models";
import { adminMediaApi } from "@/lib/api-services";

type MediaStatusFilter = "active" | "archived" | "cleanup_failed";
type MediaConfirmAction = "archive" | "unarchive" | "permanent-delete";
type MediaConfirmation = {
  action: MediaConfirmAction;
  item: AdminMedia;
};

export function MediaLibraryPanel() {
  const [status, setStatus] = useState<MediaStatusFilter>("active");
  const [confirmation, setConfirmation] = useState<MediaConfirmation | null>(null);
  const loadMedia = useCallback(
    () =>
      adminMediaApi.list({
        limit: 24,
        compression_status: status === "active" ? undefined : status,
      }),
    [status],
  );
  const media = useApiQuery(["admin", "media-library", status], loadMedia);
  const items = media.data?.items ?? [];

  const retry = async (item: AdminMedia) => {
    try {
      await adminMediaApi.retry(item.id);
      toast.success("Media diproses ulang");
      media.reload();
    } catch (error) {
      toast.error("Media gagal diproses ulang", {
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
        await adminMediaApi.archive(item.id);
        toast.success("Media diarsipkan");
      } else if (action === "unarchive") {
        await adminMediaApi.unarchive(item.id);
        toast.success("Media dipulihkan dari arsip");
      } else {
        await adminMediaApi.remove(item.id);
        toast.success("Media dihapus");
      }

      setConfirmation(null);
      media.reload();
    } catch (error) {
      toast.error(mediaActionErrorTitle(action), {
        description: getErrorMessage(error, {
          action: action === "permanent-delete" ? "delete" : "save",
        }),
      });
    }
  };

  return (
    <section>
      <PageTitle
        title="Pustaka Media"
        desc="Kelola gambar dan video yang dipakai pada konten website."
      />
      <div className="mb-4 flex max-w-full overflow-x-auto rounded-full border border-border bg-secondary p-1 text-xs font-semibold [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-fit">
        {[
          { value: "active", label: "Aktif" },
          { value: "archived", label: "Arsip" },
          { value: "cleanup_failed", label: "Perlu Dibersihkan" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setStatus(option.value as MediaStatusFilter)}
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
      {media.loading && !media.data && <LoadingState label="Memuat media..." />}
      {media.error && <ErrorState error={media.error} onRetry={media.reload} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.length === 0 && !media.loading && (
          <Card className="sm:col-span-2 lg:col-span-4">
            <EmptyState title={emptyMediaTitle(status)} />
          </Card>
        )}
        {items.map((item) => {
          const preview = item.thumbnail_url ?? item.poster_url ?? item.medium_url ?? item.file_url;
          return (
            <Card key={item.id} className="p-3">
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-secondary">
                {preview ? (
                  <img
                    src={preview}
                    alt={item.original_file_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    {item.media_type}
                  </div>
                )}
              </div>
              <div className="mt-3 min-w-0">
                <p className="truncate text-sm font-semibold">{item.original_file_name}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={item.compression_status} />
                  <span className="text-xs text-muted-foreground">
                    {item.media_type === "video" ? "Video" : "Gambar"}
                  </span>
                </div>
                {item.error && (
                  <p className="text-anywhere mt-2 text-xs text-destructive">
                    Media gagal diproses. Coba proses ulang atau unggah ulang file.
                  </p>
                )}
                <ActionButtonGroup className="mt-3 justify-start">
                  {item.compression_status === "failed" && (
                    <IconActionButton
                      label={`Proses ulang media ${item.original_file_name}`}
                      tooltip="Proses ulang"
                      onClick={() => retry(item)}
                      icon={<RefreshCw className="h-4 w-4" />}
                    />
                  )}
                  {item.compression_status === "archived" ? (
                    <IconActionButton
                      label={`Pulihkan media ${item.original_file_name}`}
                      tooltip="Pulihkan"
                      onClick={() => setConfirmation({ action: "unarchive", item })}
                      icon={<RotateCcw className="h-4 w-4" />}
                      tone="primary"
                    />
                  ) : (
                    item.compression_status !== "cleanup_failed" && (
                      <IconActionButton
                        label={`Arsipkan media ${item.original_file_name}`}
                        tooltip="Arsipkan"
                        onClick={() => setConfirmation({ action: "archive", item })}
                        icon={<Archive className="h-4 w-4" />}
                        tone="muted"
                      />
                    )
                  )}
                  <IconActionButton
                    label={`Hapus media ${item.original_file_name}`}
                    tooltip="Hapus"
                    onClick={() => setConfirmation({ action: "permanent-delete", item })}
                    icon={<Trash2 className="h-4 w-4" />}
                    tone="danger"
                  />
                </ActionButtonGroup>
              </div>
            </Card>
          );
        })}
      </div>
      <ConfirmDialog
        open={Boolean(confirmation)}
        onOpenChange={(open) => !open && setConfirmation(null)}
        title={
          confirmation
            ? mediaConfirmTitle(confirmation.action, confirmation.item.original_file_name)
            : "Konfirmasi media"
        }
        description={confirmation ? mediaConfirmDescription(confirmation.action) : ""}
        confirmLabel={confirmation ? mediaConfirmLabel(confirmation.action) : "Lanjutkan"}
        destructive={confirmation?.action === "permanent-delete"}
        onConfirm={confirmAction}
      />
    </section>
  );
}

function emptyMediaTitle(status: MediaStatusFilter) {
  if (status === "archived") {
    return "Tidak ada media di arsip";
  }

  if (status === "cleanup_failed") {
    return "Tidak ada media yang perlu dibersihkan";
  }

  return "Belum ada media aktif";
}

function mediaConfirmTitle(action: MediaConfirmAction, fileName: string) {
  if (action === "archive") {
    return `Arsipkan media ${fileName}?`;
  }

  if (action === "unarchive") {
    return `Pulihkan media ${fileName}?`;
  }

  return `Hapus media ${fileName}?`;
}

function mediaConfirmDescription(action: MediaConfirmAction) {
  if (action === "archive") {
    return "Media ini akan diarsipkan dan tidak muncul di daftar aktif. File tetap tersimpan dan dapat dipulihkan kapan saja.";
  }

  if (action === "unarchive") {
    return "Media ini akan dipulihkan dari arsip dan dapat dipilih kembali untuk konten.";
  }

  return "Media ini akan dihapus dari sistem dan file juga akan dihapus dari penyimpanan media. Aksi ini tidak dapat dibatalkan. Media yang masih dipakai konten tidak dapat dihapus.";
}

function mediaConfirmLabel(action: MediaConfirmAction) {
  if (action === "archive") {
    return "Arsipkan";
  }

  if (action === "unarchive") {
    return "Pulihkan";
  }

  return "Hapus";
}

function mediaActionErrorTitle(action: MediaConfirmAction) {
  if (action === "archive") {
    return "Media gagal diarsipkan";
  }

  if (action === "unarchive") {
    return "Media gagal dipulihkan";
  }

  return "Media gagal dihapus";
}
