import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AtSign,
  CheckCircle2,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Send,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/public/PageHero";
import { fallbackSettings } from "@/components/public/site-settings";
import { getErrorMessage } from "@/hooks/use-api-query";
import { publicContentApi, publicLeadApi } from "@/lib/api-services";
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

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const settings = Route.useLoaderData();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setSending(true);

    try {
      await publicLeadApi.createInquiry({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        company: String(formData.get("company") ?? ""),
        message: String(formData.get("message") ?? ""),
        website: String(formData.get("website") ?? ""),
      });
      setSent(true);
      setTimeout(() => setSent(false), 4000);
      form.reset();
    } catch (error) {
      toast.error("Pesan gagal dikirim", {
        description: getErrorMessage(error, { action: "send", audience: "public" }),
      });
    } finally {
      setSending(false);
    }
  };

  const contactItems = [
    { icon: Mail, label: "Email", value: settings.email },
    { icon: Phone, label: "Telepon / WhatsApp", value: settings.phone },
    { icon: Instagram, label: "Instagram", value: `@${settings.instagram}` },
    { icon: UserRound, label: settings.contact_role, value: settings.contact_person },
    { icon: MapPin, label: "Kantor Marketing", value: settings.address },
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
            {contactItems.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={submit} className="rounded-3xl bg-card p-8 shadow-elegant">
            {sent && (
              <div className="mb-5 flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">
                <CheckCircle2 className="h-4 w-4" /> Pesan berhasil dikirim.
              </div>
            )}
            <h2 className="font-display text-2xl font-bold text-primary-deep">Kirim Pesan</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Isi form di bawah, kami akan segera menghubungi Anda.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Nama" name="name" required />
              <Field label="Email" name="email" type="email" required />
              <Field label="Nomor Telepon" name="phone" type="tel" required />
              <Field label="Perusahaan" name="company" placeholder="Opsional" />
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold">Pesan</label>
              <textarea
                required
                rows={5}
                name="message"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
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
              <Send className="h-4 w-4" /> {sending ? "Mengirim..." : "Kirim Pesan"}
            </button>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <AtSign className="h-3.5 w-3.5" /> Respon akan diarahkan ke tim marketing Indobraga.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}

function Field({
  label,
  ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-xs font-semibold">{label}</label>
      <input
        {...rest}
        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
