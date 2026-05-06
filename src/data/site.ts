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
import sublimImg from "@/assets/printing-sublim.jpg";
import pressImg from "@/assets/printing-press.jpg";
import dtfImg from "@/assets/printing-dtf.jpg";

export const portfolios = [
  {
    id: 1,
    title: "Training Jersey Klub Profesional",
    category: "Jersey",
    image: tshirt,
    desc: "Jersey training, home, away, dan third kit untuk kebutuhan tim olahraga profesional.",
  },
  {
    id: 2,
    title: "Official Polo Shirt",
    category: "Polo",
    image: polo,
    desc: "Polo shirt official untuk komunitas, klub, brand, dan kebutuhan korporat.",
  },
  {
    id: 3,
    title: "Corporate Safety Wearpack",
    category: "Wearpack",
    image: wearpack,
    desc: "Wearpack safety dan seragam lapangan dengan material kuat dan detail fungsional.",
  },
  {
    id: 4,
    title: "Windrunner & Sport Jacket",
    category: "Jaket",
    image: jacket,
    desc: "Jaket sport, varsity, bomber, dan windrunner untuk brand serta tim profesional.",
  },
  {
    id: 5,
    title: "Hoodie & Crewneck",
    category: "Hoodie",
    image: hoodie,
    desc: "Hoodie, crewneck, dan apparel kasual dengan finishing rapi dan pilihan material premium.",
  },
  {
    id: 6,
    title: "Corporate Shirt & Uniform",
    category: "Seragam",
    image: uniform,
    desc: "Kemeja, seragam kantor, dan uniform custom untuk kebutuhan perusahaan dan institusi.",
  },
  {
    id: 7,
    title: "Official T-Shirt Merchandise",
    category: "Kaos",
    image: tshirt,
    desc: "T-shirt official, event merchandise, dan apparel promosi untuk skala bisnis.",
  },
  {
    id: 8,
    title: "Totebag, Waistbag & Slingbag",
    category: "Tas",
    image: uniform,
    desc: "Backpack, slingbag, waistbag, walletbag, totebag, dan messenger bag custom.",
  },
] as const;

export const machines = [
  {
    id: 1,
    name: "Atexco Model X Plus",
    image: press,
    metric: "5.000 m/hari",
    desc: "Mesin fabric sublimation berkapasitas besar untuk output konsisten dan standar internasional.",
  },
  {
    id: 2,
    name: "Press & DTF Production",
    image: embroidery,
    metric: "7.000 m/hari",
    desc: "Kapasitas press 5.000 meter per hari dan DTF 2.000 meter per hari untuk kebutuhan printing.",
  },
  {
    id: 3,
    name: "Cutting & Pattern Area",
    image: cutting,
    metric: "In-house",
    desc: "Pattern making, cutting, dan sample development dikerjakan internal untuk menjaga presisi.",
  },
  {
    id: 4,
    name: "Sewing & Quality Control",
    image: sewing,
    metric: "QC ketat",
    desc: "Proses jahit, finishing, packing, dan quality control bertahap untuk produksi skala bisnis.",
  },
] as const;

export const productionCapacity = [
  { product: "Jackets", value: "6.000", unit: "pcs / bulan" },
  { product: "T-shirts", value: "45.000", unit: "pcs / bulan" },
  { product: "Shirts", value: "10.000", unit: "pcs / bulan" },
  { product: "Backpack", value: "9.000", unit: "pcs / bulan" },
  { product: "Slingbag", value: "20.000", unit: "pcs / bulan" },
] as const;

export const printingCapacity = [
  {
    label: "Sublim",
    value: "5.000",
    unit: "meter / hari",
    image: sublimImg,
    desc: "Mesin sublimasi Atexco Model X Plus dengan certified ink dan output konsisten.",
  },
  {
    label: "Press",
    value: "5.000",
    unit: "meter / hari",
    image: pressImg,
    desc: "Heat press industrial untuk transfer print dengan presisi suhu dan tekanan.",
  },
  {
    label: "DTF",
    value: "2.000",
    unit: "meter / hari",
    image: dtfImg,
    desc: "Direct-to-Film printing untuk desain detail dengan warna tajam pada beragam material.",
  },
] as const;

export const services = [
  "Full production package",
  "CMT",
  "Pattern making",
  "Garment sample",
  "Research & development",
  "Garment quality control",
  "Custom fabric printing",
  "Manufacturing consulting",
  "Apparel photography",
] as const;

export const news = [
  {
    id: 1,
    slug: "atexco-model-x-plus",
    title: "Indobraga Perkuat Produksi dengan Atexco Model X Plus",
    category: "Fasilitas",
    date: "2026-04-22",
    thumb: press,
    excerpt:
      "Mesin fabric sublimation berkapasitas besar mendukung output konsisten untuk kebutuhan apparel skala bisnis.",
    content: [
      "Indobraga memperkuat lini custom fabric printing melalui mesin Atexco Model X Plus.",
      "Fasilitas ini mendukung kapasitas sublimasi hingga 5.000 meter per hari dengan standar tinta tersertifikasi.",
    ],
  },
  {
    id: 2,
    slug: "portfolio-sportswear-profesional",
    title: "Portofolio Sportswear untuk Klub dan Event Profesional",
    category: "Portofolio",
    date: "2026-03-10",
    thumb: jacket,
    excerpt:
      "Produksi jersey, tracksuit, windrunner, polo, dan merchandise olahraga menjadi salah satu kekuatan Indobraga.",
    content: [
      "Indobraga telah mengerjakan berbagai kebutuhan sportswear, mulai dari jersey, polo shirt, hingga tracksuit.",
      "Ragam portfolio ini memperkuat posisi Indobraga sebagai mitra produksi multiproduk untuk brand dan komunitas.",
    ],
  },
  {
    id: 3,
    slug: "kapasitas-produksi-90000-pcs",
    title: "Kapasitas Produksi Mencapai 90.000 Pcs per Bulan",
    category: "Produksi",
    date: "2026-02-18",
    thumb: sewing,
    excerpt:
      "Kapasitas produksi bulanan mencakup jackets, t-shirts, shirts, backpack, dan slingbag.",
    content: [
      "Kapasitas produksi Indobraga mencapai total 90.000 pcs per bulan untuk beberapa kategori utama.",
      "Angka ini menjadi fondasi layanan produksi bagi perusahaan, klub, institusi, dan brand apparel.",
    ],
  },
] as const;

export const partners = [
  { name: "Persib", segment: "Klub Sepak Bola" },
  { name: "Persebaya", segment: "Klub Sepak Bola" },
  { name: "Persija", segment: "Klub Sepak Bola" },
  { name: "Arema FC", segment: "Klub Sepak Bola" },
  { name: "Persis", segment: "Klub Sepak Bola" },
  { name: "Persela", segment: "Klub Sepak Bola" },
  { name: "Jakarta Electric PLN", segment: "Tim Olahraga" },
  { name: "Prawira Bandung", segment: "Klub Basket" },
  { name: "Satria Muda Pertamina", segment: "Klub Basket" },
  { name: "Dewa United", segment: "Klub Olahraga" },
  { name: "Rans Simba", segment: "Klub Olahraga" },
  { name: "FTL", segment: "Kebugaran" },
  { name: "Will Fitness", segment: "Kebugaran" },
  { name: "Celebrity Fitness", segment: "Kebugaran" },
  { name: "Sportama", segment: "Merek Olahraga" },
  { name: "Juaraga", segment: "Merek Olahraga" },
  { name: "Singo Edan Apparel", segment: "Pakaian" },
  { name: "ASA Active Wear", segment: "Pakaian" },
  { name: "ARK", segment: "Pakaian" },
  { name: "Homebreaks 3.4.7", segment: "Pakaian" },
  { name: "Oragle", segment: "Pakaian" },
  { name: "Astronkido", segment: "Pakaian" },
  { name: "Vlata", segment: "Tas & Pakaian" },
  { name: "PON XXI Aceh-Sumut 2024", segment: "Acara" },
  { name: "Premier Place", segment: "Perhotelan" },
  { name: "Corporate Client Mark", segment: "Korporasi" },
  { name: "Len", segment: "Korporasi" },
  { name: "Primavista", segment: "Korporasi" },
  { name: "Tupperware", segment: "Korporasi" },
  { name: "Freeport Indonesia", segment: "Korporasi" },
  { name: "Wirecard", segment: "Korporasi" },
  { name: "KAI", segment: "Transportasi" },
  { name: "BNI", segment: "Perbankan" },
  { name: "Bank BRI", segment: "Perbankan" },
  { name: "Gudang Garam", segment: "Korporasi" },
  { name: "Pertamina", segment: "Energi" },
  { name: "Universitas Singaperbangsa Karawang", segment: "Pendidikan" },
  { name: "Universitas Padjadjaran", segment: "Pendidikan" },
  { name: "Universitas Pasundan", segment: "Pendidikan" },
] as const;

export const strengths = [
  { label: "Kapasitas Produksi", value: "90K", suffix: "pcs / bulan" },
  { label: "Pengalaman Garment", value: "14+", suffix: "tahun produksi" },
  { label: "Kapasitas Printing", value: "12K", suffix: "meter / hari" },
  { label: "Berdiri Sejak", value: "2010", suffix: "asal Indonesia" },
] as const;

export const gallery = [
  {
    id: 1,
    type: "image" as const,
    media: press,
    caption: "Lini sublimasi Atexco Model X Plus dalam operasi harian.",
    date: "2026-04-20",
  },
  {
    id: 2,
    type: "image" as const,
    media: sewing,
    caption: "Tim sewing menyelesaikan order jersey klub profesional.",
    date: "2026-04-12",
  },
  {
    id: 3,
    type: "image" as const,
    media: cutting,
    caption: "Proses cutting & pattern in-house untuk presisi produksi.",
    date: "2026-04-05",
  },
  {
    id: 4,
    type: "image" as const,
    media: jacket,
    caption: "Sample windrunner siap untuk approval klien brand.",
    date: "2026-03-28",
  },
  {
    id: 5,
    type: "image" as const,
    media: hoodie,
    caption: "Finishing hoodie premium sebelum tahap quality control.",
    date: "2026-03-22",
  },
  {
    id: 6,
    type: "video" as const,
    media: embroidery,
    poster: embroidery,
    caption: "Cuplikan area press & DTF berkapasitas 7.000 m/hari.",
    date: "2026-03-15",
  },
  {
    id: 7,
    type: "image" as const,
    media: uniform,
    caption: "Family gathering tim produksi Indobraga 2026.",
    date: "2026-03-08",
  },
  {
    id: 8,
    type: "image" as const,
    media: polo,
    caption: "Packing polo shirt official untuk pengiriman korporat.",
    date: "2026-02-26",
  },
  {
    id: 9,
    type: "image" as const,
    media: tshirt,
    caption: "Display merchandise event partner Indobraga.",
    date: "2026-02-14",
  },
] as const;

export const COMPANY = {
  brand: "Indobraga",
  legal: "PT. Braga Indonesia Perkasa",
  email: "indobraga@gmail.com",
  instagram: "indobraga",
  phone: "0851-5870-0895",
  whatsapp: "6285158700895",
  contactPerson: "Mahardika",
  contactRole: "Tim Marketing",
  address: "Jalan Babakan Tarogong No. 292, Kota Bandung",
};
