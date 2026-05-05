import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { Card, PageTitle, PrimaryButton } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/email-blast")({ component: E });

function E() {
  return (
    <>
      <PageTitle
        title="Kirim Email Massal"
        desc="Kirim email kepada daftar penerima yang sudah ditentukan."
        action={
          <PrimaryButton>
            <Send className="h-4 w-4" /> Kirim Email
          </PrimaryButton>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-4">
          <F label="Nama Pengiriman" placeholder="Promo Kuartal 2 2026" />
          <div>
            <label className="text-xs font-semibold">Akun Pengirim</label>
            <select className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
              <option>marketing@indobraga.co.id</option>
              <option>info@indobraga.co.id</option>
            </select>
          </div>
          <F label="Subjek Email" placeholder="Tulis subjek email..." />
          <div>
            <label className="text-xs font-semibold">Isi Email</label>
            <textarea
              rows={8}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold">Daftar Penerima (pisahkan dengan koma)</label>
            <textarea
              rows={4}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-mono text-xs"
            />
          </div>
        </Card>
        <Card>
          <h3 className="mb-3 font-display text-lg font-bold">Ringkasan</h3>
          <ul className="space-y-3 text-sm">
            <R k="Akun pengirim" v="marketing@indobraga.co.id" />
            <R k="Estimasi penerima" v="0 alamat" />
            <R k="Status awal" v="Menunggu" />
          </ul>
          <p className="mt-4 rounded-lg bg-warning/10 p-3 text-xs">
            Email dikirim bertahap oleh sistem.
          </p>
        </Card>
      </div>
    </>
  );
}

function F({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-xs font-semibold">{label}</label>
      <input
        {...rest}
        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
      />
    </div>
  );
}

function R({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex justify-between border-b border-border pb-2 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold">{v}</span>
    </li>
  );
}
