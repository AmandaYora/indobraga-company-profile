import { ReactNode } from "react";

export function PageTitle({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex min-w-0 flex-wrap items-start justify-between gap-3 sm:items-end">
      <div className="min-w-0 flex-1">
        <h1 className="text-anywhere font-display text-2xl font-bold text-primary-deep sm:text-3xl">
          {title}
        </h1>
        {desc && (
          <p className="text-anywhere mt-1 max-w-3xl text-sm text-muted-foreground">{desc}</p>
        )}
      </div>
      {action && <div className="flex w-full min-w-0 sm:w-auto sm:justify-end">{action}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`min-w-0 rounded-xl border border-border bg-card p-4 shadow-card sm:rounded-2xl sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-primary/10 text-primary",
    contacted: "bg-warning/15 text-[oklch(0.45_0.15_75)]",
    in_progress: "bg-accent/20 text-accent-foreground",
    closed: "bg-success/15 text-success",
    spam: "bg-destructive/10 text-destructive",
    published: "bg-success/15 text-success",
    draft: "bg-muted text-muted-foreground",
    archived: "bg-muted text-muted-foreground",
    connected: "bg-success/15 text-success",
    expired: "bg-destructive/10 text-destructive",
    revoked: "bg-destructive/10 text-destructive",
    pending: "bg-warning/15 text-[oklch(0.45_0.15_75)]",
    sending: "bg-primary/10 text-primary",
    sent: "bg-success/15 text-success",
    completed: "bg-success/15 text-success",
    failed: "bg-destructive/10 text-destructive",
    cancelled: "bg-muted text-muted-foreground",
    skipped: "bg-muted text-muted-foreground",
    queued: "bg-warning/15 text-[oklch(0.45_0.15_75)]",
    temporary_failed: "bg-warning/15 text-[oklch(0.45_0.15_75)]",
    delivered: "bg-success/15 text-success",
    disabled: "bg-muted text-muted-foreground",
    invalid: "bg-destructive/10 text-destructive",
    needs_reconnect: "bg-warning/15 text-[oklch(0.45_0.15_75)]",
    processing: "bg-primary/10 text-primary",
    pending_delete: "bg-warning/15 text-[oklch(0.45_0.15_75)]",
    cleanup_failed: "bg-destructive/10 text-destructive",
    deleted: "bg-muted text-muted-foreground",
    proses: "bg-primary/10 text-primary",
    selesai: "bg-success/15 text-success",
    active: "bg-success/15 text-success",
    inactive: "bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = {
    new: "Baru",
    contacted: "Sudah Dihubungi",
    in_progress: "Dalam Proses",
    closed: "Selesai",
    spam: "Spam",
    published: "Tayang",
    draft: "Draf",
    archived: "Diarsipkan",
    connected: "Terhubung",
    expired: "Perlu Hubungkan Ulang",
    revoked: "Akses Dicabut",
    pending: "Menunggu",
    sending: "Mengirim",
    sent: "Terkirim",
    completed: "Selesai",
    failed: "Gagal",
    cancelled: "Dibatalkan",
    skipped: "Dilewati",
    queued: "Antre",
    temporary_failed: "Gagal Sementara",
    delivered: "Terkirim",
    disabled: "Nonaktif",
    invalid: "Tidak Valid",
    needs_reconnect: "Perlu Hubungkan Ulang",
    processing: "Diproses",
    pending_delete: "Menunggu Dihapus",
    cleanup_failed: "Perlu Dibersihkan",
    deleted: "Dihapus",
    proses: "Diproses",
    selesai: "Selesai",
    active: "Aktif",
    inactive: "Tidak Aktif",
  };
  return (
    <span
      className={`inline-flex max-w-full min-w-0 items-center justify-center rounded-full px-2.5 py-0.5 text-center text-xs font-semibold leading-tight whitespace-normal break-words ${map[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {labels[status] ?? "Status belum dikenal"}
    </span>
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex max-w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-center text-sm font-semibold leading-tight text-primary-foreground shadow-card transition hover:bg-primary-deep ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-center text-sm font-semibold leading-tight text-foreground transition hover:bg-secondary ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}
