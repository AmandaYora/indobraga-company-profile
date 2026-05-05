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
import { PageHero } from "@/components/public/PageHero";
import { COMPANY, machines } from "@/data/site";

export const Route = createFileRoute("/_public/kontak")({
  component: ContactPage,
  head: () => ({ meta: [{ title: "Kontak - Indobraga" }] }),
});

function ContactPage() {
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    (e.target as HTMLFormElement).reset();
  };

  const contactItems = [
    { icon: Mail, label: "Email", value: COMPANY.email },
    { icon: Phone, label: "Phone / WhatsApp", value: COMPANY.phone },
    { icon: Instagram, label: "Instagram", value: `@${COMPANY.instagram}` },
    { icon: UserRound, label: COMPANY.contactRole, value: COMPANY.contactPerson },
    { icon: MapPin, label: "Marketing Office", value: COMPANY.address },
  ];

  return (
    <>
      <PageHero
        kicker="Kontak"
        title="Mari bicarakan kebutuhan produksi Anda"
        subtitle="Tim marketing Indobraga siap membantu diskusi kebutuhan garment, kapasitas, material, dan timeline produksi."
        image={machines[0].image}
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
            <button
              type="submit"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-accent py-3.5 text-sm font-bold text-accent-foreground shadow-card"
            >
              <Send className="h-4 w-4" /> Kirim Pesan
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
