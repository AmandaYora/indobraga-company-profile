import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save, Send, Eye } from "lucide-react";
import { toast } from "sonner";
import { Card, GhostButton, PageTitle, PrimaryButton } from "@/components/admin/ui";
import { ConfirmDialog, CrudModal, Field, Select, TextArea, TextInput } from "@/components/admin/CrudModal";

export const Route = createFileRoute("/admin/email-blast")({ component: E });

function E() {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);

  return (
    <>
      <PageTitle
        title="Kirim Email Massal"
        desc="Kirim email kepada daftar penerima yang sudah ditentukan."
        action={
          <div className="flex gap-2">
            <GhostButton onClick={() => toast.success("Disimpan sebagai draf")}><Save className="h-4 w-4" /> Simpan Draf</GhostButton>
            <GhostButton onClick={() => setOpenPreview(true)}><Eye className="h-4 w-4" /> Pratinjau</GhostButton>
            <PrimaryButton onClick={() => setOpenConfirm(true)}><Send className="h-4 w-4" /> Kirim Email</PrimaryButton>
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-4">
          <Field label="Nama Pengiriman" required><TextInput placeholder="Promo Kuartal 2 2026" /></Field>
          <Field label="Akun Pengirim" required>
            <Select>
              <option>marketing@indobraga.co.id</option>
              <option>info@indobraga.co.id</option>
            </Select>
          </Field>
          <Field label="Subjek Email" required><TextInput placeholder="Tulis subjek email..." /></Field>
          <Field label="Isi Email" required hint="Mendukung penanda {{nama}} untuk personalisasi.">
            <TextArea rows={8} />
          </Field>
          <Field label="Daftar Penerima" hint="Pisahkan dengan koma atau baris baru.">
            <TextArea rows={4} className="font-mono text-xs" />
          </Field>
        </Card>
        <Card>
          <h3 className="mb-3 font-display text-lg font-bold">Ringkasan</h3>
          <ul className="space-y-3 text-sm">
            <R k="Akun pengirim" v="marketing@indobraga.co.id" />
            <R k="Estimasi penerima" v="0 alamat" />
            <R k="Status awal" v="Menunggu" />
          </ul>
          <p className="mt-4 rounded-lg bg-warning/10 p-3 text-xs">
            Email dikirim bertahap oleh sistem untuk menghindari rate limit.
          </p>
        </Card>
      </div>

      <ConfirmDialog
        open={openConfirm}
        onOpenChange={setOpenConfirm}
        title="Kirim email massal sekarang?"
        description="Setelah dikirim, pengiriman tidak dapat dibatalkan untuk penerima yang sudah terkirim."
        confirmLabel="Kirim"
        destructive={false}
        onConfirm={() => { setOpenConfirm(false); toast.success("Email massal mulai dikirim", { description: "Anda dapat memantau di Riwayat Email Massal." }); }}
      />

      <CrudModal
        open={openPreview}
        onOpenChange={setOpenPreview}
        title="Pratinjau Email"
        size="md"
        onSubmit={() => setOpenPreview(false)}
        submitLabel="Tutup"
      >
        <div className="rounded-xl border border-border bg-secondary p-4">
          <p className="text-xs text-muted-foreground">Dari: marketing@indobraga.co.id</p>
          <p className="text-xs text-muted-foreground">Subjek: Promo Kuartal 2 2026</p>
          <hr className="my-3 border-border" />
          <p className="text-sm">Halo {"{{nama}}"}, ini pratinjau email yang akan dikirim ke penerima.</p>
        </div>
      </CrudModal>
    </>
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
