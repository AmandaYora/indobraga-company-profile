import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { publicLeadApi } from "@/lib/api-services";
import { useSiteSettings } from "./site-settings";

export function WhatsAppFAB() {
  const settings = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    const message = `Halo Indobraga, saya ${name}. Nomor saya ${phone}. Saya ingin berdiskusi lebih lanjut mengenai kebutuhan produksi garment.`;
    setSent(true);

    try {
      const lead = await publicLeadApi.createWhatsAppLead({ name, phone, message });
      window.open(lead.whatsapp_url, "_blank");
      setOpen(false);
      setName("");
      setPhone("");
    } catch (error) {
      const text = encodeURIComponent(message);
      window.open(`https://wa.me/${settings.whatsapp}?text=${text}`, "_blank");
      toast.error("Prospek WhatsApp belum tersimpan", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSent(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.65_0.18_150)] text-white shadow-elegant transition-transform hover:scale-110"
        aria-label="Hubungi via WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary-deep/40 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-elegant animate-fade-up">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-primary-deep">Chat via WhatsApp</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tinggalkan kontak Anda, tim kami siap membantu.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup form WhatsApp"
                title="Tutup"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Nama Lengkap</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Nama Anda"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Nomor Telepon</label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
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
