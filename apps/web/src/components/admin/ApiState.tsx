import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Card, GhostButton } from "@/components/admin/ui";
import { getErrorMessage } from "@/hooks/use-api-query";

export function LoadingState({ label = "Memuat data..." }: { label?: string }) {
  return (
    <Card>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </Card>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="min-w-0">
            <p className="font-semibold text-destructive">Data gagal dimuat</p>
            <p className="text-anywhere mt-1 text-sm text-muted-foreground">
              {getErrorMessage(error)}
            </p>
          </div>
        </div>
        {onRetry && (
          <GhostButton type="button" onClick={onRetry} className="shrink-0">
            <RefreshCw className="h-4 w-4" />
            Coba lagi
          </GhostButton>
        )}
      </div>
    </Card>
  );
}

export function PublicErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm">
      <p className="font-semibold text-destructive">Konten belum dapat dimuat.</p>
      <p className="text-anywhere mt-1 text-muted-foreground">{getErrorMessage(error)}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
        >
          Coba lagi
        </button>
      )}
    </div>
  );
}
