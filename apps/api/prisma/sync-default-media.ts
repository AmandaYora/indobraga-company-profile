import "dotenv/config";
import { Prisma, PrismaClient, ContentStatus, MediaKind, MediaStatus } from "@prisma/client";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import sharp from "sharp";
import { validateEnv } from "../src/config/env";
import { LocalStorageService } from "../src/media/local-storage.service";
import type { MediaStorageService } from "../src/media/media-storage.types";
import { publicObjectUrl } from "../src/media/media-storage-url";
import { S3StorageService } from "../src/media/s3-storage.service";
import { createPrismaAdapter } from "../src/database/prisma-adapter";

type MediaUsage =
  | "hero"
  | "partner"
  | "portfolio"
  | "machine"
  | "gallery"
  | "news"
  | "og"
  | "other";

type DefaultMediaAsset = {
  id: string;
  filename: string;
  usage: MediaUsage;
  altText: string;
  caption?: string;
};

type ImageVariant = {
  objectKey: string;
  publicUrl: string;
  bytes: number;
};

const prisma = new PrismaClient({ adapter: createPrismaAdapter() });
const env = validateEnv(process.env);
const storageConfig = {
  get: (key: keyof typeof env) => env[key],
};
const storage: MediaStorageService =
  env.STORAGE_DRIVER === "s3"
    ? new S3StorageService(storageConfig as never)
    : new LocalStorageService(storageConfig as never);
const importGroup = process.env.DEFAULT_MEDIA_IMPORT_GROUP?.trim() || "default";
const defaultMediaRoots = [
  join(__dirname, "default-media"),
  join(process.cwd(), "prisma", "default-media"),
];
const CACHE_CONTROL_IMMUTABLE = "public, max-age=31536000, immutable";

const mediaCategoryByUsage: Record<MediaUsage, string> = {
  gallery: "galeri",
  hero: "hero",
  machine: "mesin",
  news: "berita",
  og: "seo",
  other: "lainnya",
  partner: "partner",
  portfolio: "portofolio",
};

const portfolioCategories = [
  { name: "Jersey", slug: "jersey", sortOrder: 10 },
  { name: "Polo", slug: "polo", sortOrder: 20 },
  { name: "Wearpack", slug: "wearpack", sortOrder: 30 },
  { name: "Jaket", slug: "jaket", sortOrder: 40 },
  { name: "Hoodie", slug: "hoodie", sortOrder: 50 },
  { name: "Seragam", slug: "seragam", sortOrder: 60 },
  { name: "Kaos", slug: "kaos", sortOrder: 70 },
  { name: "Tas", slug: "tas", sortOrder: 80 },
] as const;

const partnerAssets = [
  ["Persib", "Klub Sepak Bola", "persib.png"],
  ["Persebaya", "Klub Sepak Bola", "persebaya.png"],
  ["Persija", "Klub Sepak Bola", "persija.png"],
  ["Arema FC", "Klub Sepak Bola", "arema-fc.png"],
  ["Persis", "Klub Sepak Bola", "persis.png"],
  ["Persela", "Klub Sepak Bola", "persela.png"],
  ["Jakarta Electric PLN", "Tim Olahraga", "jakarta-electric-pln.png"],
  ["Prawira Bandung", "Klub Basket", "prawira-bandung.png"],
  ["Satria Muda Pertamina", "Klub Basket", "satria-muda-pertamina.png"],
  ["Dewa United", "Klub Olahraga", "dewa-united.png"],
  ["Rans Simba", "Klub Olahraga", "rans-simba.png"],
  ["FTL", "Kebugaran", "ftl.png"],
  ["Will Fitness", "Kebugaran", "will-fitness.png"],
  ["Celebrity Fitness", "Kebugaran", "celebrity-fitness.png"],
  ["Sportama", "Merek Olahraga", "sportama.png"],
  ["Juaraga", "Merek Olahraga", "juaraga.png"],
  ["Singo Edan Apparel", "Pakaian", "singo-edan-apparel.png"],
  ["ASA Active Wear", "Pakaian", "asa-active-wear.png"],
  ["ARK", "Pakaian", "ark.png"],
  ["Homebreaks 3.4.7", "Pakaian", "homebreaks-347.png"],
  ["Oragle", "Pakaian", "oragle.png"],
  ["Astronkido", "Pakaian", "astronkido.png"],
  ["Vlata", "Tas & Pakaian", "vlata.png"],
  ["PON XXI Aceh-Sumut 2024", "Acara", "pon-xxi.png"],
  ["Premier Place", "Perhotelan", "premier-place.png"],
  ["Corporate Client Mark", "Korporasi", "corporate-client-mark.png"],
  ["Len", "Korporasi", "len.png"],
  ["Primavista", "Korporasi", "primavista.png"],
  ["Tupperware", "Korporasi", "tupperware.png"],
  ["Freeport Indonesia", "Korporasi", "freeport-indonesia.png"],
  ["Wirecard", "Korporasi", "wirecard.png"],
  ["KAI", "Transportasi", "kai.png"],
  ["BNI", "Perbankan", "bni.png"],
  ["Bank BRI", "Perbankan", "bank-bri.png"],
  ["Gudang Garam", "Korporasi", "gudang-garam.png"],
  ["Pertamina", "Energi", "pertamina.png"],
  ["Universitas Singaperbangsa Karawang", "Pendidikan", "unsika.png"],
  ["Universitas Padjadjaran", "Pendidikan", "universitas-padjadjaran.png"],
  ["Universitas Pasundan", "Pendidikan", "universitas-pasundan.png"],
] as const;

const portfolioItems = [
  {
    title: "Training Jersey Klub Profesional",
    category: "Jersey",
    file: "portfolio-tshirt.jpg",
    description:
      "Jersey training, home, away, dan third kit untuk kebutuhan tim olahraga profesional.",
    sortOrder: 10,
  },
  {
    title: "Official Polo Shirt",
    category: "Polo",
    file: "portfolio-polo.jpg",
    description: "Polo shirt official untuk komunitas, klub, brand, dan kebutuhan korporat.",
    sortOrder: 20,
  },
  {
    title: "Corporate Safety Wearpack",
    category: "Wearpack",
    file: "portfolio-wearpack.jpg",
    description: "Wearpack safety dan seragam lapangan dengan material kuat dan detail fungsional.",
    sortOrder: 30,
  },
  {
    title: "Windrunner & Sport Jacket",
    category: "Jaket",
    file: "portfolio-jacket.jpg",
    description: "Jaket sport, varsity, bomber, dan windrunner untuk brand serta tim profesional.",
    sortOrder: 40,
  },
  {
    title: "Hoodie & Crewneck",
    category: "Hoodie",
    file: "portfolio-hoodie.jpg",
    description:
      "Hoodie, crewneck, dan apparel kasual dengan finishing rapi dan pilihan material premium.",
    sortOrder: 50,
  },
  {
    title: "Corporate Shirt & Uniform",
    category: "Seragam",
    file: "portfolio-uniform.jpg",
    description:
      "Kemeja, seragam kantor, dan uniform custom untuk kebutuhan perusahaan dan institusi.",
    sortOrder: 60,
  },
  {
    title: "Official T-Shirt Merchandise",
    category: "Kaos",
    file: "portfolio-tshirt.jpg",
    description: "T-shirt official, event merchandise, dan apparel promosi untuk skala bisnis.",
    sortOrder: 70,
  },
  {
    title: "Totebag, Waistbag & Slingbag",
    category: "Tas",
    file: "portfolio-uniform.jpg",
    description: "Backpack, slingbag, waistbag, walletbag, totebag, dan messenger bag custom.",
    sortOrder: 80,
  },
] as const;

const machineItems = [
  {
    name: "Atexco Model X Plus",
    file: "machine-press.jpg",
    metric: "5.000 m/hari",
    description:
      "Mesin fabric sublimation berkapasitas besar untuk output konsisten dan standar internasional.",
    sortOrder: 10,
  },
  {
    name: "Press & DTF Production",
    file: "machine-embroidery.jpg",
    metric: "7.000 m/hari",
    description:
      "Kapasitas press 5.000 meter per hari dan DTF 2.000 meter per hari untuk kebutuhan printing.",
    sortOrder: 20,
  },
  {
    name: "Cutting & Pattern Area",
    file: "machine-cutting.jpg",
    metric: "In-house",
    description:
      "Pattern making, cutting, dan sample development dikerjakan internal untuk menjaga presisi.",
    sortOrder: 30,
  },
  {
    name: "Sewing & Quality Control",
    file: "machine-sewing.jpg",
    metric: "QC ketat",
    description:
      "Proses jahit, finishing, packing, dan quality control bertahap untuk produksi skala bisnis.",
    sortOrder: 40,
  },
] as const;

const printingItems = [
  {
    label: "Sublim",
    file: "printing-sublim.jpg",
    value: "5.000",
    unit: "meter / hari",
    description: "Mesin sublimasi Atexco Model X Plus dengan certified ink dan output konsisten.",
    sortOrder: 10,
  },
  {
    label: "Press",
    file: "printing-press.jpg",
    value: "5.000",
    unit: "meter / hari",
    description: "Heat press industrial untuk transfer print dengan presisi suhu dan tekanan.",
    sortOrder: 20,
  },
  {
    label: "DTF",
    file: "printing-dtf.jpg",
    value: "2.000",
    unit: "meter / hari",
    description:
      "Direct-to-Film printing untuk desain detail dengan warna tajam pada beragam material.",
    sortOrder: 30,
  },
] as const;

const productionCapacities = [
  { product: "Jackets", value: "6.000", unit: "pcs / bulan", sortOrder: 10 },
  { product: "T-shirts", value: "45.000", unit: "pcs / bulan", sortOrder: 20 },
  { product: "Shirts", value: "10.000", unit: "pcs / bulan", sortOrder: 30 },
  { product: "Backpack", value: "9.000", unit: "pcs / bulan", sortOrder: 40 },
  { product: "Slingbag", value: "20.000", unit: "pcs / bulan", sortOrder: 50 },
] as const;

const services = [
  "Full production package",
  "CMT",
  "Pattern making",
  "Garment sample",
  "Research & development",
  "Garment quality control",
  "Cetak Kain Custom",
  "Manufacturing consulting",
  "Apparel photography",
] as const;

const strengths = [
  { label: "Kapasitas Produksi", value: "90K", suffix: "pcs / bulan", sortOrder: 10 },
  { label: "Pengalaman Garment", value: "14+", suffix: "tahun produksi", sortOrder: 20 },
  { label: "Kapasitas Printing", value: "12K", suffix: "meter / hari", sortOrder: 30 },
  { label: "Berdiri Sejak", value: "2010", suffix: "asal Indonesia", sortOrder: 40 },
] as const;

const newsItems = [
  {
    slug: "atexco-model-x-plus",
    title: "Indobraga Perkuat Produksi dengan Atexco Model X Plus",
    category: "Fasilitas",
    date: new Date("2026-04-22T00:00:00.000Z"),
    file: "machine-press.jpg",
    excerpt:
      "Mesin fabric sublimation berkapasitas besar mendukung output konsisten untuk kebutuhan apparel skala bisnis.",
    content: [
      "Indobraga memperkuat lini cetak kain custom melalui mesin Atexco Model X Plus.",
      "Fasilitas ini mendukung kapasitas sublimasi hingga 5.000 meter per hari dengan standar tinta tersertifikasi.",
    ],
  },
  {
    slug: "portfolio-sportswear-profesional",
    title: "Portofolio Sportswear untuk Klub dan Event Profesional",
    category: "Portofolio",
    date: new Date("2026-03-10T00:00:00.000Z"),
    file: "portfolio-jacket.jpg",
    excerpt:
      "Produksi jersey, tracksuit, windrunner, polo, dan merchandise olahraga menjadi salah satu kekuatan Indobraga.",
    content: [
      "Indobraga telah mengerjakan berbagai kebutuhan sportswear, mulai dari jersey, polo shirt, hingga tracksuit.",
      "Ragam portofolio ini memperkuat posisi Indobraga sebagai mitra produksi multiproduk untuk brand dan komunitas.",
    ],
  },
  {
    slug: "kapasitas-produksi-90000-pcs",
    title: "Kapasitas Produksi Mencapai 90.000 Pcs per Bulan",
    category: "Produksi",
    date: new Date("2026-02-18T00:00:00.000Z"),
    file: "machine-sewing.jpg",
    excerpt:
      "Kapasitas produksi bulanan mencakup jackets, t-shirts, shirts, backpack, dan slingbag.",
    content: [
      "Kapasitas produksi Indobraga mencapai total 90.000 pcs per bulan untuk beberapa kategori utama.",
      "Angka ini menjadi fondasi layanan produksi bagi perusahaan, klub, institusi, dan brand apparel.",
    ],
  },
] as const;

const galleryItems = [
  ["machine-press.jpg", "Lini sublimasi Atexco Model X Plus dalam operasi harian.", "2026-04-20"],
  ["machine-sewing.jpg", "Tim sewing menyelesaikan order jersey klub profesional.", "2026-04-12"],
  [
    "machine-cutting.jpg",
    "Proses cutting & pattern in-house untuk presisi produksi.",
    "2026-04-05",
  ],
  ["portfolio-jacket.jpg", "Sample windrunner siap untuk approval klien brand.", "2026-03-28"],
  ["portfolio-hoodie.jpg", "Finishing hoodie premium sebelum tahap quality control.", "2026-03-22"],
  ["machine-embroidery.jpg", "Cuplikan area press & DTF berkapasitas 7.000 m/hari.", "2026-03-15"],
  ["portfolio-uniform.jpg", "Family gathering tim produksi Indobraga 2026.", "2026-03-08"],
  ["portfolio-polo.jpg", "Packing polo shirt official untuk pengiriman korporat.", "2026-02-26"],
  ["portfolio-tshirt.jpg", "Display merchandise event partner Indobraga.", "2026-02-14"],
] as const;

const assetManifest: DefaultMediaAsset[] = [
  asset("logo-indobraga-kuning", "logo-indobraga-kuning.png", "other", "Logo Indobraga"),
  asset("hero-factory", "hero-factory.jpg", "hero", "Fasilitas produksi Indobraga"),
  asset("hero-garment", "hero-garment-slide.jpg", "hero", "Produksi garment Indobraga"),
  asset("hero-sublim", "hero-sublim-slide.jpg", "hero", "Mesin sublimasi kain Indobraga"),
  asset("machine-cutting", "machine-cutting.jpg", "machine", "Area cutting dan pattern"),
  asset("machine-embroidery", "machine-embroidery.jpg", "machine", "Area press dan DTF"),
  asset("machine-press", "machine-press.jpg", "machine", "Mesin sublimasi Atexco"),
  asset("machine-sewing", "machine-sewing.jpg", "machine", "Area sewing dan quality control"),
  asset("news-branch", "news-branch.jpg", "news", "Dokumentasi berita perusahaan"),
  asset("news-gathering", "news-gathering.jpg", "news", "Dokumentasi gathering perusahaan"),
  asset("news-partnership", "news-partnership.jpg", "news", "Dokumentasi partnership perusahaan"),
  asset("portfolio-hoodie", "portfolio-hoodie.jpg", "portfolio", "Produk hoodie dan crewneck"),
  asset("portfolio-jacket", "portfolio-jacket.jpg", "portfolio", "Produk jaket sport"),
  asset("portfolio-polo", "portfolio-polo.jpg", "portfolio", "Produk polo shirt"),
  asset("portfolio-tshirt", "portfolio-tshirt.jpg", "portfolio", "Produk t-shirt dan jersey"),
  asset("portfolio-uniform", "portfolio-uniform.jpg", "portfolio", "Produk seragam dan uniform"),
  asset("portfolio-wearpack", "portfolio-wearpack.jpg", "portfolio", "Produk wearpack safety"),
  asset("printing-dtf", "printing-dtf.jpg", "machine", "Produksi DTF"),
  asset("printing-press", "printing-press.jpg", "machine", "Produksi press"),
  asset("printing-sublim", "printing-sublim.jpg", "machine", "Produksi sublim"),
  ...partnerAssets.map(([name, , file]) =>
    asset(`client-${slugify(name)}`, `clients/${file}`, "partner", `Logo ${name}`),
  ),
];

async function main() {
  const mediaByAssetId = new Map<string, number>();
  const mediaByFilename = new Map<string, number>();

  for (const item of assetManifest) {
    const media = await syncDefaultMedia(item);
    mediaByAssetId.set(item.id, media.id);
    mediaByFilename.set(basename(item.filename), media.id);
    console.log(`Media siap: ${item.filename} -> ${media.publicUrl}`);
  }

  await seedContent(mediaByAssetId, mediaByFilename);
}

function asset(
  id: string,
  filename: string,
  usage: MediaUsage,
  altText: string,
): DefaultMediaAsset {
  return {
    id,
    filename,
    usage,
    altText,
  };
}

async function syncDefaultMedia(item: DefaultMediaAsset) {
  const objectRoot = createObjectRoot(item);
  const sourcePath = findDefaultMediaSource(item.filename);

  if (sourcePath) {
    return syncDefaultImageAsset(item, objectRoot, sourcePath);
  }

  const thumbnail = imageVariant(objectRoot, "thumbnail");
  const medium = imageVariant(objectRoot, "medium");
  const large = imageVariant(objectRoot, "large");

  return upsertMediaRecord(item, { large, medium, thumbnail });
}

function findDefaultMediaSource(filename: string): string | null {
  for (const root of defaultMediaRoots) {
    const sourcePath = join(root, filename);
    if (existsSync(sourcePath)) {
      return sourcePath;
    }
  }

  return null;
}

async function syncDefaultImageAsset(
  item: DefaultMediaAsset,
  objectRoot: string,
  sourcePath: string,
) {
  const original = await readFile(sourcePath);
  const metadata = await sharp(original, { failOn: "warning" }).rotate().metadata();
  const [thumbnail, medium, large] = await Promise.all([
    uploadImageVariant(objectRoot, "thumbnail", original, env.MEDIA_THUMBNAIL_MAX_WIDTH),
    uploadImageVariant(objectRoot, "medium", original, env.MEDIA_MEDIUM_MAX_WIDTH),
    uploadImageVariant(objectRoot, "large", original, env.MEDIA_LARGE_MAX_WIDTH),
  ]);

  return upsertMediaRecord(item, {
    large,
    medium,
    thumbnail,
    originalBytes: original.byteLength,
    finalBytes: thumbnail.bytes + medium.bytes + large.bytes,
    width: metadata.width ?? null,
    height: metadata.height ?? null,
  });
}

async function uploadImageVariant(
  rootKey: string,
  variant: "thumbnail" | "medium" | "large",
  buffer: Buffer,
  width: number,
): Promise<ImageVariant> {
  const output = await sharp(buffer)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const stored = await storage.put(`${rootKey}-${variant}.webp`, output, {
    cacheControl: CACHE_CONTROL_IMMUTABLE,
    contentType: "image/webp",
  });

  return {
    objectKey: stored.objectKey,
    publicUrl: stored.publicUrl,
    bytes: output.byteLength,
  };
}

function upsertMediaRecord(
  item: DefaultMediaAsset,
  data: {
    large: ImageVariant;
    medium: ImageVariant;
    thumbnail: ImageVariant;
    originalBytes?: number;
    finalBytes?: number;
    width?: number | null;
    height?: number | null;
  },
) {
  return prisma.mediaFile.upsert({
    where: { objectKey: data.large.objectKey },
    update: {
      status: MediaStatus.COMPLETED,
      originalFilename: basename(item.filename),
      mimeType: "image/webp",
      extension: "webp",
      publicUrl: data.large.publicUrl,
      thumbnailUrl: data.thumbnail.publicUrl,
      mediumUrl: data.medium.publicUrl,
      largeUrl: data.large.publicUrl,
      posterUrl: null,
      videoUrl: null,
      sizeOriginalBytes: typeof data.originalBytes === "number" ? BigInt(data.originalBytes) : null,
      sizeFinalBytes: typeof data.finalBytes === "number" ? BigInt(data.finalBytes) : null,
      width: data.width ?? null,
      height: data.height ?? null,
      errorMessage: null,
      variants: mediaVariants(item, data.thumbnail, data.medium, data.large),
    },
    create: {
      kind: MediaKind.IMAGE,
      status: MediaStatus.COMPLETED,
      originalFilename: basename(item.filename),
      mimeType: "image/webp",
      extension: "webp",
      objectKey: data.large.objectKey,
      publicUrl: data.large.publicUrl,
      thumbnailUrl: data.thumbnail.publicUrl,
      mediumUrl: data.medium.publicUrl,
      largeUrl: data.large.publicUrl,
      sizeOriginalBytes: typeof data.originalBytes === "number" ? BigInt(data.originalBytes) : null,
      sizeFinalBytes: typeof data.finalBytes === "number" ? BigInt(data.finalBytes) : null,
      width: data.width ?? null,
      height: data.height ?? null,
      variants: mediaVariants(item, data.thumbnail, data.medium, data.large),
    },
  });
}

function createObjectRoot(item: DefaultMediaAsset): string {
  const prefix = env.MEDIA_OBJECT_PREFIX;
  const storageEnv = env.MEDIA_STORAGE_ENV ?? (env.NODE_ENV === "production" ? "prod" : "dev");
  const category = mediaCategoryByUsage[item.usage];
  const slug = slugify(item.id);

  return `${prefix}/${storageEnv}/${category}/${importGroup}/${slug}`;
}

function imageVariant(rootKey: string, variant: "thumbnail" | "medium" | "large"): ImageVariant {
  const objectKey = `${rootKey}-${variant}.webp`;

  return {
    objectKey,
    publicUrl: publicObjectUrl(env.PUBLIC_MEDIA_URL, objectKey),
    bytes: 0,
  };
}

function mediaVariants(
  item: DefaultMediaAsset,
  thumbnail: ImageVariant,
  medium: ImageVariant,
  large: ImageVariant,
): Prisma.InputJsonObject {
  return {
    usage: item.usage,
    alt_text: item.altText,
    caption: item.caption,
    source: "default-object-storage-media",
    default_media_id: item.id,
    original_filename: item.filename,
    import_group: importGroup,
    thumbnail,
    medium,
    large,
  };
}

async function seedContent(
  mediaByAssetId: Map<string, number>,
  mediaByFilename: Map<string, number>,
) {
  const logoId = requiredMedia(mediaByAssetId, "logo-indobraga-kuning");
  const contactHeroId = requiredMedia(mediaByAssetId, "hero-factory");
  const ogId = requiredMedia(mediaByAssetId, "hero-garment");
  const currentSettings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    include: { logoMediaFile: true },
  });
  const shouldUseDefaultLogo =
    !currentSettings?.logoMediaFileId || isDefaultSiteLogo(currentSettings.logoMediaFile);

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {
      ...(shouldUseDefaultLogo ? { logoMediaFileId: logoId, showBrandText: false } : {}),
      contactHeroMediaFileId: contactHeroId,
      ogMediaFileId: ogId,
    },
    create: {
      id: 1,
      brand: "Indobraga",
      legalName: "PT. Braga Indonesia Perkasa",
      email: "indobraga@gmail.com",
      phone: "0851-5870-0895",
      whatsapp: "6285158700895",
      instagram: "indobraga",
      contactPerson: "Mahardika",
      contactRole: "Tim Marketing",
      address: "Jalan Babakan Tarogong No. 292, Kota Bandung",
      seoTitle: "Indobraga - Solusi Produksi Garment Profesional",
      seoDescription:
        "Indobraga melayani produksi jersey, polo, jaket, wearpack, seragam, bag merchandise, dan cetak kain custom.",
      logoMediaFileId: logoId,
      showBrandText: false,
      contactHeroMediaFileId: contactHeroId,
      ogMediaFileId: ogId,
    },
  });

  const hero = await upsertHeroSection();
  await upsertHeroSlide(hero.id, {
    label: "Garment Production",
    title: "Garment",
    metric: "90K pcs/bulan",
    altText: "Lini produksi garment Indobraga untuk sportswear dan corporate apparel",
    mediaFileId: requiredMedia(mediaByAssetId, "hero-garment"),
    sortOrder: 10,
  });
  await upsertHeroSlide(hero.id, {
    label: "Cetak Kain Custom",
    title: "Sublim",
    metric: "5K meter/hari",
    altText: "Mesin sublimasi kain Indobraga untuk cetak kain custom",
    mediaFileId: requiredMedia(mediaByAssetId, "hero-sublim"),
    sortOrder: 20,
  });

  for (const [index, [name, segment]] of partnerAssets.entries()) {
    await upsertPartner({
      name,
      segment,
      logoMediaId: requiredMedia(mediaByAssetId, `client-${slugify(name)}`),
      sortOrder: (index + 1) * 10,
    });
  }

  for (const category of portfolioCategories) {
    await prisma.portfolioCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
        status: ContentStatus.PUBLISHED,
      },
      create: {
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
        status: ContentStatus.PUBLISHED,
      },
    });
  }

  for (const item of portfolioItems) {
    const category = await prisma.portfolioCategory.findUniqueOrThrow({
      where: { slug: slugify(item.category) },
    });
    await prisma.portfolio.upsert({
      where: { slug: slugify(item.title) },
      update: {
        category: category.name,
        categoryId: category.id,
        description: item.description,
        featured: true,
        imageMediaId: requiredMedia(mediaByFilename, item.file),
        sortOrder: item.sortOrder,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      create: {
        title: item.title,
        slug: slugify(item.title),
        category: category.name,
        categoryId: category.id,
        description: item.description,
        featured: true,
        imageMediaId: requiredMedia(mediaByFilename, item.file),
        sortOrder: item.sortOrder,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  for (const item of strengths) {
    await upsertProductionStrength(item);
  }

  for (const item of machineItems) {
    await prisma.machine.upsert({
      where: { slug: slugify(item.name) },
      update: {
        metric: item.metric,
        description: item.description,
        imageMediaId: requiredMedia(mediaByFilename, item.file),
        sortOrder: item.sortOrder,
        status: ContentStatus.PUBLISHED,
      },
      create: {
        name: item.name,
        slug: slugify(item.name),
        metric: item.metric,
        description: item.description,
        imageMediaId: requiredMedia(mediaByFilename, item.file),
        sortOrder: item.sortOrder,
        status: ContentStatus.PUBLISHED,
      },
    });
  }

  for (const item of printingItems) {
    await upsertPrintingCapacity({
      ...item,
      imageMediaId: requiredMedia(mediaByFilename, item.file),
    });
  }

  for (const item of productionCapacities) {
    await upsertProductionCapacity(item);
  }

  for (const [index, name] of services.entries()) {
    await upsertService(name, (index + 1) * 10);
  }

  for (const item of newsItems) {
    await prisma.newsArticle.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        category: item.category,
        excerpt: item.excerpt,
        content: [...item.content],
        thumbnailMediaId: requiredMedia(mediaByFilename, item.file),
        ogMediaId: requiredMedia(mediaByFilename, item.file),
        status: ContentStatus.PUBLISHED,
        publishedAt: item.date,
      },
      create: {
        title: item.title,
        slug: item.slug,
        category: item.category,
        excerpt: item.excerpt,
        content: [...item.content],
        thumbnailMediaId: requiredMedia(mediaByFilename, item.file),
        ogMediaId: requiredMedia(mediaByFilename, item.file),
        status: ContentStatus.PUBLISHED,
        publishedAt: item.date,
      },
    });
  }

  for (const [index, [file, caption, date]] of galleryItems.entries()) {
    await upsertGalleryItem({
      caption,
      mediaFileId: requiredMedia(mediaByFilename, file),
      sortOrder: (index + 1) * 10,
      publishedAt: new Date(`${date}T00:00:00.000Z`),
    });
  }
}

function isDefaultSiteLogo(media: { variants: Prisma.JsonValue } | null): boolean {
  if (!media || typeof media.variants !== "object" || Array.isArray(media.variants)) {
    return false;
  }

  const defaultMediaId = (media.variants as Prisma.JsonObject).default_media_id;
  return defaultMediaId === "logo" || defaultMediaId === "logo-indobraga-kuning";
}

async function upsertHeroSection() {
  const current = await prisma.heroSection.findFirst({
    where: { title: "Produksi Garment dan Sublim Skala Bisnis" },
  });
  const data = {
    title: "Produksi Garment dan Sublim Skala Bisnis",
    subtitle:
      "Indobraga membantu brand, komunitas, dan perusahaan memproduksi apparel siap pakai, mulai dari pattern, cutting, sewing, hingga sublimasi kain dengan output konsisten.",
    ctaLabel: "Konsultasi Produksi",
    ctaHref: "/kontak",
    status: ContentStatus.PUBLISHED,
  };

  return current
    ? prisma.heroSection.update({ where: { id: current.id }, data })
    : prisma.heroSection.create({ data });
}

async function upsertHeroSlide(
  heroSectionId: number,
  input: {
    label: string;
    title: string;
    metric: string;
    altText: string;
    mediaFileId: number;
    sortOrder: number;
  },
) {
  const current = await prisma.heroSlide.findFirst({
    where: { heroSectionId, title: input.title },
  });
  const data = {
    heroSectionId,
    label: input.label,
    title: input.title,
    metric: input.metric,
    altText: input.altText,
    mediaFileId: input.mediaFileId,
    sortOrder: input.sortOrder,
    status: ContentStatus.PUBLISHED,
  };

  return current
    ? prisma.heroSlide.update({ where: { id: current.id }, data })
    : prisma.heroSlide.create({ data });
}

async function upsertPartner(input: {
  name: string;
  segment: string;
  logoMediaId: number;
  sortOrder: number;
}) {
  const current = await prisma.partner.findFirst({ where: { name: input.name } });
  const data = {
    name: input.name,
    segment: input.segment,
    logoMediaId: input.logoMediaId,
    sortOrder: input.sortOrder,
    status: ContentStatus.PUBLISHED,
  };

  return current
    ? prisma.partner.update({ where: { id: current.id }, data })
    : prisma.partner.create({ data });
}

async function upsertProductionStrength(input: {
  label: string;
  value: string;
  suffix: string;
  sortOrder: number;
}) {
  const current = await prisma.productionStrength.findFirst({ where: { label: input.label } });
  const data = {
    label: input.label,
    value: input.value,
    suffix: input.suffix,
    sortOrder: input.sortOrder,
    status: ContentStatus.PUBLISHED,
  };

  return current
    ? prisma.productionStrength.update({ where: { id: current.id }, data })
    : prisma.productionStrength.create({ data });
}

async function upsertPrintingCapacity(input: {
  label: string;
  value: string;
  unit: string;
  description: string;
  imageMediaId: number;
  sortOrder: number;
}) {
  const current = await prisma.printingCapacity.findFirst({ where: { label: input.label } });
  const data = {
    label: input.label,
    value: input.value,
    unit: input.unit,
    description: input.description,
    imageMediaId: input.imageMediaId,
    sortOrder: input.sortOrder,
    status: ContentStatus.PUBLISHED,
  };

  return current
    ? prisma.printingCapacity.update({ where: { id: current.id }, data })
    : prisma.printingCapacity.create({ data });
}

async function upsertProductionCapacity(input: {
  product: string;
  value: string;
  unit: string;
  sortOrder: number;
}) {
  const current = await prisma.productionCapacity.findFirst({ where: { product: input.product } });
  const data = {
    product: input.product,
    value: input.value,
    unit: input.unit,
    sortOrder: input.sortOrder,
    status: ContentStatus.PUBLISHED,
  };

  return current
    ? prisma.productionCapacity.update({ where: { id: current.id }, data })
    : prisma.productionCapacity.create({ data });
}

async function upsertService(name: string, sortOrder: number) {
  const current = await prisma.serviceItem.findFirst({ where: { name } });
  const data = { name, sortOrder, status: ContentStatus.PUBLISHED };

  return current
    ? prisma.serviceItem.update({ where: { id: current.id }, data })
    : prisma.serviceItem.create({ data });
}

async function upsertGalleryItem(input: {
  caption: string;
  mediaFileId: number;
  sortOrder: number;
  publishedAt: Date;
}) {
  const current = await prisma.galleryItem.findFirst({ where: { caption: input.caption } });
  const data = {
    type: MediaKind.IMAGE,
    caption: input.caption,
    mediaFileId: input.mediaFileId,
    sortOrder: input.sortOrder,
    status: ContentStatus.PUBLISHED,
    publishedAt: input.publishedAt,
  };

  return current
    ? prisma.galleryItem.update({ where: { id: current.id }, data })
    : prisma.galleryItem.create({ data });
}

function requiredMedia(map: Map<string, number>, key: string): number {
  const id = map.get(key);
  if (!id) {
    throw new Error(`Media ${key} belum tersedia.`);
  }

  return id;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "asset";
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
