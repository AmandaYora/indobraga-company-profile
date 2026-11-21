import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/hooks/use-api-query";
import { publicLeadApi } from "@/lib/api-services";
import { clearFieldError, fieldErrorsFromError, type FieldErrors } from "@/lib/form-errors";
import { isValidPhoneInput, PHONE_FORMAT_HINT } from "@/lib/lead-contact";

const inputCls =
  "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20";

export function WhatsAppFAB() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const titleId = useId();
  const nameId = useId();
  const phoneId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    nameInputRef.current?.focus();
    const trigger = triggerRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open]);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (name.trim().length < 2) {
      next.name = "Nama lengkap wajib diisi (minimal 2 karakter).";
    }
    if (!phone.trim()) {
      next.phone = "Nomor telepon wajib diisi.";
    } else if (!isValidPhoneInput(phone)) {
      next.phone = `Nomor telepon belum valid. ${PHONE_FORMAT_HINT}`;
    }
    return next;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const message = `Halo Indobraga, saya ${cleanName}. Nomor saya ${cleanPhone}. Saya ingin berdiskusi lebih lanjut mengenai kebutuhan produksi garment.`;
    setErrors({});
    setSent(true);

    try {
      const lead = await publicLeadApi.createWhatsAppLead({
        name: cleanName,
        phone: cleanPhone,
        message,
      });
      // Only open WhatsApp once the lead is saved, so every chat has a record (QA IB-05).
      window.open(lead.whatsapp_url, "_blank", "noopener,noreferrer");
      setOpen(false);
      setName("");
      setPhone("");
    } catch (error) {
      const serverErrors = fieldErrorsFromError(error);
      if (Object.keys(serverErrors).length > 0) {
        setErrors(serverErrors);
      }
      const description = getErrorMessage(error, { action: "send", audience: "public" });
      setFormError(description);
      toast.error("Data belum terkirim", { description });
    } finally {
      setSent(false);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-elegant transition-transform hover:scale-110"
        aria-label="Hubungi via WhatsApp"
        aria-haspopup="dialog"
      >
        <img
          src="/whatsapp.png"
          alt="Logo WhatsApp"
          className="h-full w-full rounded-full object-contain"
        />
        <span className="absolute -top-1 -right-1 flex h-3 w-3" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary-deep/40 p-4 backdrop-blur-sm sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-elegant animate-fade-up"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 id={titleId} className="text-lg font-bold text-primary-deep">
                  Chat via WhatsApp
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tinggalkan kontak Anda, tim kami siap membantu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup form WhatsApp"
                title="Tutup"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submit} noValidate className="mt-5 space-y-4">
              <div>
                <label htmlFor={nameId} className="text-xs font-semibold text-foreground">
                  Nama Lengkap
                </label>
                <input
                  ref={nameInputRef}
                  id={nameId}
                  name="name"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors((current) => clearFieldError(current, "name"));
                  }}
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? `${nameId}-error` : undefined}
                  className={inputCls}
                  placeholder="Nama Anda"
                />
                {errors.name && (
                  <p
                    id={`${nameId}-error`}
                    role="alert"
                    className="mt-1 text-xs font-medium text-destructive"
                  >
                    {errors.name}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor={phoneId} className="text-xs font-semibold text-foreground">
                  Nomor Telepon
                </label>
                <input
                  id={phoneId}
                  name="phone"
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setErrors((current) => clearFieldError(current, "phone"));
                  }}
                  aria-invalid={errors.phone ? true : undefined}
                  aria-describedby={errors.phone ? `${phoneId}-error` : undefined}
                  className={inputCls}
                  placeholder="08xxxxxxxxxx"
                />
                {errors.phone && (
                  <p
                    id={`${phoneId}-error`}
                    role="alert"
                    className="mt-1 text-xs font-medium text-destructive"
                  >
                    {errors.phone}
                  </p>
                )}
              </div>
              {formError && !errors.name && !errors.phone && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {formError}
                </p>
              )}
              <button
                type="submit"
                disabled={sent}
                className="w-full rounded-lg bg-[oklch(0.55_0.18_150)] py-2.5 text-sm font-semibold text-white transition hover:bg-[oklch(0.5_0.18_150)] disabled:opacity-60"
              >
                {sent ? "Mengarahkan ke WhatsApp..." : "Lanjutkan ke WhatsApp"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
