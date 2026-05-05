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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary-deep sm:text-3xl">{title}</h1>
        {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-card ${className}`}>
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
    connected: "bg-success/15 text-success",
    expired: "bg-destructive/10 text-destructive",
    revoked: "bg-destructive/10 text-destructive",
    pending: "bg-warning/15 text-[oklch(0.45_0.15_75)]",
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
    connected: "Terhubung",
    expired: "Perlu Hubungkan Ulang",
    revoked: "Akses Dicabut",
    pending: "Menunggu",
    proses: "Diproses",
    selesai: "Selesai",
    active: "Aktif",
    inactive: "Tidak Aktif",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {labels[status] ?? status.replace("_", " ")}
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
      className={`inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:bg-primary-deep ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}
