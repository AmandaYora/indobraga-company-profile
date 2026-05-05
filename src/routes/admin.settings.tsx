import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { Card, PageTitle, PrimaryButton } from "@/components/admin/ui";
import { COMPANY } from "@/data/site";
export const Route = createFileRoute("/admin/settings")({ component: S });
function S() {
  return (<><PageTitle title="Site Settings" desc="Konfigurasi umum website." action={<PrimaryButton><Save className="h-4 w-4" /> Simpan</PrimaryButton>} /><div className="grid gap-6 md:grid-cols-2"><Card><h3 className="mb-4 font-display text-lg font-bold">Identitas Perusahaan</h3><div className="space-y-4"><F label="Nama Brand" value={COMPANY.brand} /><F label="Nama Legal" value={COMPANY.legal} /><F label="Email Resmi" value={COMPANY.email} /><F label="Telepon" value={COMPANY.phone} /><F label="Nomor WhatsApp" value={COMPANY.whatsapp} /><F label="Alamat" value={COMPANY.address} textarea /></div></Card><Card><h3 className="mb-4 font-display text-lg font-bold">SEO Metadata</h3><div className="space-y-4"><F label="Title Default" value="Indobraga — Solusi Produksi Garment Profesional" /><F label="Description" textarea value="Custom apparel, uniform, merchandise." /><F label="Keywords" value="garment, konveksi, custom apparel" /></div></Card></div></>);
}
function F({ label, value, textarea }: { label: string; value: string; textarea?: boolean }) {
  return (<div><label className="text-xs font-semibold">{label}</label>{textarea ? <textarea defaultValue={value} rows={3} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" /> : <input defaultValue={value} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" />}</div>);
}
