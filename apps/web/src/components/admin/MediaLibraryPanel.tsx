import { useCallback, useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "@/components/admin/ApiState";
import { ConfirmDialog } from "@/components/admin/CrudModal";
import { EmptyState } from "@/components/admin/Pagination";
import { Card, PageTitle, StatusBadge } from "@/components/admin/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import type { AdminMedia } from "@/lib/api-models";
import { adminMediaApi } from "@/lib/api-services";

export function MediaLibraryPanel() {
  const [target, setTarget] = useState<AdminMedia | null>(null);
  const loadMedia = useCallback(() => adminMediaApi.list({ limit: 24 }), []);
  const media = useApiQuery(["admin", "media-library"], loadMedia);
  const items = media.data?.items ?? [];

  const retry = async (item: AdminMedia) => {
    try {
      await adminMediaApi.retry(item.id);
      toast.success("Retry media dijalankan");
      media.reload();
    } catch (error) {
      toast.error("Retry media gagal", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const remove = async () => {
    if (!target) {
      return;
    }

    try {
      await adminMediaApi.remove(target.id);
      toast.success("Media dihapus");
      setTarget(null);
      media.reload();
    } catch (error) {
      toast.error("Media gagal dihapus", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <section>
      <PageTitle
        title="Media Library"
        desc="Listing media dari backend untuk cek status processing, retry failed, dan hapus media yang tidak direferensikan."
      />
      {media.loading && !media.data && <LoadingState label="Memuat media..." />}
      {media.error && <ErrorState error={media.error} onRetry={media.reload} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.length === 0 && !media.loading && (
          <Card className="sm:col-span-2 lg:col-span-4">
            <EmptyState title="Belum ada media" />
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
                  <span className="text-xs text-muted-foreground">{item.media_type}</span>
                </div>
                {item.error && (
                  <p className="text-anywhere mt-2 text-xs text-destructive">{item.error}</p>
                )}
                <div className="mt-3 flex gap-1">
                  {item.compression_status === "failed" && (
                    <button
                      aria-label={`Retry media ${item.original_file_name}`}
                      title="Retry media"
                      onClick={() => retry(item)}
                      className="rounded-md p-2 hover:bg-secondary"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    aria-label={`Hapus media ${item.original_file_name}`}
                    title="Hapus media"
                    onClick={() => setTarget(item)}
                    className="rounded-md p-2 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <ConfirmDialog
        open={Boolean(target)}
        onOpenChange={(open) => !open && setTarget(null)}
        title={target ? `Hapus media ${target.original_file_name}?` : "Hapus media?"}
        description="Backend akan menolak penghapusan jika media masih direferensikan konten."
        onConfirm={remove}
      />
    </section>
  );
}
