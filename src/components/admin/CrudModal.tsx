import { ReactNode } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GhostButton, PrimaryButton } from "@/components/admin/ui";

/* ---------------- Form Modal ---------------- */
export function CrudModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "Simpan",
  size = "md",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeMap = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${sizeMap[size]} max-h-[92vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary-deep">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.();
          }}
          className="space-y-4"
        >
          <div className="space-y-4 py-2">{children}</div>
          <DialogFooter className="gap-2 sm:gap-2">
            <GhostButton type="button" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" /> Batal
            </GhostButton>
            <PrimaryButton type="submit">{submitLabel}</PrimaryButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Confirm (alert) ---------------- */
export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Hapus item ini?",
  description = "Tindakan ini tidak dapat dibatalkan.",
  confirmLabel = "Hapus",
  destructive = true,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ---------------- Form Field ---------------- */
export function Field({
  label,
  hint,
  required,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${inputCls} ${props.className ?? ""}`}>
      {children}
    </select>
  );
}

/* ---------------- Image dropzone (mock) ---------------- */
export function ImageUploadField({
  label = "Gambar",
  preview,
  hint = "JPG / PNG, maks 2 MB. Rasio ideal 4:3.",
}: {
  label?: string;
  preview?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <label className="group flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-border bg-secondary p-3 transition hover:border-primary">
        <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">Pratinjau</span>
          )}
        </div>
        <div className="text-sm">
          <p className="font-semibold text-foreground">Klik untuk unggah / ganti</p>
          <p className="text-xs text-muted-foreground">atau seret & lepas berkas ke sini</p>
        </div>
        <input type="file" accept="image/*" className="hidden" />
      </label>
    </Field>
  );
}