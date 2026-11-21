import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";
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
    sm: "sm:max-w-md",
    md: "sm:max-w-xl",
    lg: "sm:max-w-3xl",
    xl: "sm:max-w-5xl",
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-w-[calc(100vw-2rem)] ${sizeMap[size]} max-h-[92vh] overflow-y-auto`}
      >
        <DialogHeader>
          <DialogTitle className="text-anywhere pr-8 font-display text-xl text-primary-deep">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-anywhere">{description}</DialogDescription>
          )}
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

/** Form controls that Field wires to its label / error message automatically. */
const LABELLABLE = new Set<unknown>(["input", "textarea", "select"]);

export function Field({
  label,
  hint,
  required,
  error,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  required?: boolean;
  /** Validation message shown under the control; also sets aria-invalid on it. */
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  const autoId = useId();
  const errorId = `${autoId}-error`;
  const hintId = `${autoId}-hint`;

  // Link <label> to the control and expose the error to assistive tech (QA IB-10/IB-16).
  let control = children;
  let controlId: string | undefined;
  if (isValidElement(children) && isFormControl(children)) {
    const existing = children as ReactElement<Record<string, unknown>>;
    controlId = (existing.props.id as string | undefined) ?? autoId;
    const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ");
    control = cloneElement(existing, {
      id: controlId,
      "aria-invalid": error ? true : undefined,
      "aria-required": required ? true : undefined,
      "aria-describedby": describedBy || undefined,
    });
  }

  return (
    <div className={className}>
      <label
        htmlFor={controlId}
        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="mt-1.5">{control}</div>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-[11px] font-medium text-destructive">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="mt-1 text-[11px] text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

function isFormControl(element: ReactElement): boolean {
  return (
    LABELLABLE.has(element.type) ||
    element.type === TextInput ||
    element.type === TextArea ||
    element.type === Select
  );
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

const invalidCls = "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${invalidCls} ${props.className ?? ""}`} />;
}

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextArea({ className, ...props }, ref) {
  return (
    <textarea ref={ref} {...props} className={`${inputCls} ${invalidCls} ${className ?? ""}`} />
  );
});

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${inputCls} ${invalidCls} ${props.className ?? ""}`}>
      {children}
    </select>
  );
}
