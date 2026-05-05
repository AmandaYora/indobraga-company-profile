import tshirt from "@/assets/portfolio-tshirt.jpg";
import wearpack from "@/assets/portfolio-wearpack.jpg";
import hoodie from "@/assets/portfolio-hoodie.jpg";
import uniform from "@/assets/portfolio-uniform.jpg";
import jacket from "@/assets/portfolio-jacket.jpg";
import polo from "@/assets/portfolio-polo.jpg";
import sewing from "@/assets/machine-sewing.jpg";
import cutting from "@/assets/machine-cutting.jpg";
import embroidery from "@/assets/machine-embroidery.jpg";
import press from "@/assets/machine-press.jpg";
import gathering from "@/assets/news-gathering.jpg";
import partnership from "@/assets/news-partnership.jpg";
import branch from "@/assets/news-branch.jpg";

export const portfolios = [
  { id: 1, title: "Kaos Custom Premium", category: "Kaos", image: tshirt, desc: "Bahan combed 24s/30s, sablon plastisol & DTF, hasil halus dan tahan lama." },
  { id: 2, title: "Polo Shirt Korporat", category: "Polo", image: polo, desc: "Polo lacoste cotton pique dengan bordir logo perusahaan." },
  { id: 3, title: "Seragam Kerja Kantor", category: "Seragam", image: uniform, desc: "Kemeja seragam custom dengan finishing premium." },
  { id: 4, title: "Wearpack Industri", category: "Wearpack", image: wearpack, desc: "Wearpack safety dengan reflektor, drill premium, dan jahitan rangkap." },
  { id: 5, title: "Hoodie Premium", category: "Hoodie", image: hoodie, desc: "Hoodie fleece cotton, jahitan rapi, sablon discharge." },
  { id: 6, title: "Jaket Bomber", category: "Jaket", image: jacket, desc: "Jaket custom dengan bahan taslan & lining berkualitas." },
] as const;

export const machines = [
  { id: 1, name: "Mesin Jahit High Speed", image: sewing, qty: 120, desc: "Mesin jahit jarum 1 kecepatan tinggi untuk produksi massal." },
  { id: 2, name: "Mesin Potong Kain", image: cutting, qty: 8, desc: "Pemotong otomatis presisi tinggi, hemat bahan." },
  { id: 3, name: "Mesin Bordir Komputer", image: embroidery, qty: 6, desc: "Bordir multi head 12 kepala untuk logo & emblem." },
  { id: 4, name: "Mesin Press & Sablon", image: press, qty: 15, desc: "Heat press dan sablon manual/otomatis untuk semua jenis tinta." },
] as const;

export const news = [
  { id: 1, slug: "kerja-sama-bumn-2026", title: "Indobraga Resmi Menjadi Vendor Seragam BUMN", category: "Kerja Sama", date: "2026-04-22", thumb: partnership, excerpt: "Penandatanganan kontrak produksi 15.000 seragam dengan salah satu BUMN terbesar di Indonesia." },
  { id: 2, slug: "pembukaan-cabang-surabaya", title: "Pabrik Baru Indobraga Resmi Beroperasi di Surabaya", category: "Ekspansi", date: "2026-03-10", thumb: branch, excerpt: "Cabang baru memperkuat coverage produksi untuk wilayah Indonesia Timur." },
  { id: 3, slug: "family-gathering-2026", title: "Family Gathering 2026: Bersama Membangun Indobraga", category: "Internal", date: "2026-02-18", thumb: gathering, excerpt: "Lebih dari 800 karyawan berkumpul merayakan pencapaian satu tahun produksi terbaik." },
] as const;

export const partners = [
  "Astra", "Telkom", "Pertamina", "BCA", "Mandiri", "BRI", "Garuda", "Indofood",
  "Sinarmas", "Unilever", "Pupuk Kaltim", "PLN",
];

export const strengths = [
  { label: "Kapasitas Produksi", value: "150K+", suffix: "pcs / bulan" },
  { label: "Tenaga Kerja Terampil", value: "850+", suffix: "karyawan" },
  { label: "Mesin Produksi", value: "200+", suffix: "unit aktif" },
  { label: "Klien Bisnis", value: "250+", suffix: "perusahaan" },
];

export const COMPANY = {
  brand: "Indobraga",
  legal: "PT. Braga Indonesia Perkasa",
  email: "hello@indobraga.co.id",
  phone: "+62 812-3456-7890",
  whatsapp: "6281234567890",
  address: "Jl. Industri Garment No. 88, Bandung, Jawa Barat, Indonesia",
};