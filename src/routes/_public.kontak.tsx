import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { COMPANY } from "@/data/site";
export const Route = createFileRoute("/_public/kontak")({ component: C, head: () => ({ meta: [{ title: "Kontak — Indobraga" }] }) });
function C() {
  const [sent, setSent] = useState(false);
  const submit = (e: React.FormEvent) => { e.preventDefault(); setSent(true); setTimeout(() => setSent(false), 4000); (e.target as HTMLFormElement).reset(); };
  return (
    <>
      <PageHero kicker="Kontak" title="Mari bicarakan kebutuhan produksi Anda" subtitle="Tim kami akan merespons inquiry Anda dalam 1×24 jam pada hari kerja." />
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-primary-deep">Informasi Kontak</h2>
            {[{ i: Mail, l: "Email", v: COMPANY.email }, { i: Phone, l: "Telepon", v: COMPANY.phone }, { i: MapPin, l: "Alamat", v: COMPANY.address }].map(({ i: Icon, l, v }) => (
              <div key={l} className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><Icon className="h-5 w-5" /></div>
                <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{l}</p><p className="text-sm font-medium">{v}</p></div>
              </div>
            ))}
          </div>
          <form onSubmit={submit} className="rounded-3xl bg-card p-8 shadow-elegant">
            {sent && <div className="mb-5 flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success"><CheckCircle2 className="h-4 w-4" /> Pesan berhasil dikirim.</div>}
            <h2 className="font-display text-2xl font-bold text-primary-deep">Kirim Pesan</h2>
            <p className="mt-1 text-sm text-muted-foreground">Isi form di bawah, kami akan segera menghubungi Anda.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <F label="Nama" name="name" required /><F label="Email" name="email" type="email" required />
              <F label="Nomor Telepon" name="phone" type="tel" required /><F label="Perusahaan" name="company" placeholder="Opsional" />
            </div>
            <div className="mt-4"><label className="text-xs font-semibold">Pesan</label><textarea required rows={5} name="message" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
            <button type="submit" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-accent py-3.5 text-sm font-bold text-accent-foreground shadow-card"><Send className="h-4 w-4" /> Kirim Pesan</button>
          </form>
        </div>
      </section>
    </>
  );
}
function F({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (<div><label className="text-xs font-semibold">{label}</label><input {...rest} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>);
}
