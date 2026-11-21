import { createFileRoute } from "@tanstack/react-router";
import { useId, useState, type ReactNode } from "react";
import {
  AtSign,
  CheckCircle2,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/public/PageHero";
import { fallbackSettings } from "@/components/public/site-settings";
import { getErrorMessage } from "@/hooks/use-api-query";
import { publicContentApi, publicLeadApi } from "@/lib/api-services";
import {
  instagramHandle,
  instagramHref,
  mailtoHref,
  mapsHref,
  telHref,
  whatsappHref,
} from "@/lib/contact-links";
import { clearFieldError, fieldErrorsFromError, type FieldErrors } from "@/lib/form-errors";
import { isValidPhoneInput, PHONE_FORMAT_HINT } from "@/lib/lead-contact";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/_public/kontak")({
  component: ContactPage,
  loader: async () => {
    try {
      return await publicContentApi.siteSettings();
    } catch {
      return fallbackSettings;
    }
  },
  head: ({ loaderData }) =>
    pageSeo({
      title: "Kontak - Indobraga",
      description:
        "Hubungi tim marketing Indobraga untuk diskusi kebutuhan garment, cetak kain custom, kapasitas produksi, material, dan timeline order.",
      path: "/kontak",
      image: loaderData?.contact_hero_image_url ?? undefined,
    }),
});

type ContactItem = {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
};

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const settings = Route.useLoaderData();

  const validate = (values: Record<string, string>): FieldErrors => {
    const next: FieldErrors = {};
    if (values.name.trim().length < 2) {
      next.name = "Nama wajib diisi (minimal 2 karakter).";
    }
    if (!values.email.trim()) {
      next.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      next.email = "Format email belum valid.";
    }
    if (!values.phone.trim()) {
      next.phone = "Nomor telepon wajib diisi.";
    } else if (!isValidPhoneInput(values.phone)) {
      next.phone = `Nomor telepon belum valid. ${PHONE_FORMAT_HINT}`;
    }
    if (values.message.trim().length < 10) {
      next.message = "Pesan wajib diisi (minimal 10 karakter).";
    }
    return next;
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const values = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      company: String(formData.get("company") ?? ""),
      message: String(formData.get("message") ?? ""),
      website: String(formData.get("website") ?? ""),
    };

    const clientErrors = validate(values);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      window.setTimeout(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return;
    }

    setErrors({});
    setSending(true);

    try {
      await publicLeadApi.createInquiry(values);
      setSent(true);
      setTimeout(() => setSent(false), 4000);
      form.reset();
    } catch (error) {
      const serverErrors = fieldErrorsFromError(error);
      setErrors(serverErrors);
      toast.error("Pesan gagal dikirim", {
        description: getErrorMessage(error, { action: "send", audience: "public" }),
      });
    } finally {
      setSending(false);
    }
  };

  const clear = (name: string) => setErrors((current) => clearFieldError(current, name));

  const contactItems: ContactItem[] = [
    { icon: Mail, label: "Email", value: settings.email, href: mailtoHref(settings.email) },
    {
      icon: Phone,
      label: "Telepon",
      value: settings.phone,
      href: telHref(settings.phone),
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: `+${settings.whatsapp}`,
      href: whatsappHref(settings.whatsapp),
      external: true,
    },
    {
      icon: Instagram,
      label: "Instagram",
      value: `@${instagramHandle(settings.instagram)}`,
      href: instagramHref(settings.instagram),
      external: true,
    },
    { icon: UserRound, label: settings.contact_role, value: settings.contact_person },
    {
      icon: MapPin,
      label: "Kantor Marketing",
      value: settings.address,
      href: mapsHref(settings.address),
      external: true,
    },
  ];

  return (
    <>
      <PageHero
        kicker="Kontak"
        title="Mari bicarakan kebutuhan produksi Anda"
        subtitle="Tim marketing Indobraga siap membantu diskusi kebutuhan garment, kapasitas, material, dan timeline produksi."
        image={settings.contact_hero_image_url ?? undefined}
      />
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-primary-deep">Informasi Kontak</h2>
            {contactItems.map(({ icon: Icon, label, value, href, external }) => (
              <div
                key={label}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                  {href ? (
                    <a
                      href={href}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="text-anywhere text-sm font-medium text-primary underline-offset-2 hover:underline"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="text-anywhere text-sm font-medium">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={submit}
            noValidate
            aria-labelledby="contact-form-title"
            className="rounded-3xl bg-card p-8 shadow-elegant"
          >
            <div role="status" aria-live="polite">
              {sent && (
                <div className="mb-5 flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Pesan berhasil dikirim.
                </div>
              )}
            </div>
            <h2
              id="contact-form-title"
              className="font-display text-2xl font-bold text-primary-deep"
            >
              Kirim Pesan
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Isi form di bawah, kami akan segera menghubungi Anda.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field
                label="Nama"
                name="name"
                required
                autoComplete="name"
                error={errors.name}
                onInput={() => clear("name")}
              />
              <Field
                label="Email"
                name="email"
                type="email"
                required
                autoComplete="email"
                error={errors.email}
                onInput={() => clear("email")}
              />
              <Field
                label="Nomor Telepon"
                name="phone"
                type="tel"
                inputMode="tel"
                required
                autoComplete="tel"
                placeholder="08xxxxxxxxxx"
                error={errors.phone}
                onInput={() => clear("phone")}
              />
              <Field
                label="Perusahaan"
                name="company"
                autoComplete="organization"
                placeholder="Opsional"
                error={errors.company}
              />
            </div>
            <TextAreaField
              label="Pesan"
              name="message"
              required
              rows={5}
              error={errors.message}
              onInput={() => clear("message")}
            />
            {/* Honeypot: hidden from users; only bots fill it and get silently dropped. */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-9999px",
                width: 1,
                height: 1,
                overflow: "hidden",
              }}
            >
              <label>
                Website
                <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <button
              type="submit"
              disabled={sending}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-accent py-3.5 text-sm font-bold text-accent-foreground shadow-card"
            >
              <Send className="h-4 w-4" aria-hidden="true" />{" "}
              {sending ? "Mengirim..." : "Kirim Pesan"}
            </button>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <AtSign className="h-3.5 w-3.5" aria-hidden="true" /> Respon akan diarahkan ke tim
              marketing Indobraga.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}

const controlCls =
  "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20";

function FieldShell({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold">
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  error,
  ...rest
}: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} required={rest.required} error={error}>
      <input
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={controlCls}
      />
    </FieldShell>
  );
}

function TextAreaField({
  label,
  error,
  ...rest
}: { label: string; error?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className="mt-4">
      <FieldShell id={id} label={label} required={rest.required} error={error}>
        <textarea
          {...rest}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={controlCls}
        />
      </FieldShell>
    </div>
  );
}
