import {
  ContentStatus,
  EmailAccountStatus,
  EmailProviderType,
  PrismaClient,
  SmtpSecurityMode,
  UserRole,
  UserStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { createCipheriv, createHash, randomBytes } from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  await seedAdminUser();
  await seedDefaultSmtpAccount();
  await seedSiteSettings();
  await seedPortfolioCategories();
}

const defaultPortfolioCategories = [
  { name: "Jersey", slug: "jersey", sortOrder: 10 },
  { name: "Polo", slug: "polo", sortOrder: 20 },
  { name: "Wearpack", slug: "wearpack", sortOrder: 30 },
  { name: "Jaket", slug: "jaket", sortOrder: 40 },
  { name: "Hoodie", slug: "hoodie", sortOrder: 50 },
  { name: "Seragam", slug: "seragam", sortOrder: 60 },
  { name: "Kaos", slug: "kaos", sortOrder: 70 },
  { name: "Tas", slug: "tas", sortOrder: 80 },
];

async function seedAdminUser() {
  const email = (normalizedEnv("SEED_ADMIN_EMAIL") ?? "admin@indobraga.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const name = normalizedEnv("SEED_ADMIN_NAME") ?? "Admin Indobraga";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash,
    },
    create: {
      name,
      email,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
}

async function seedDefaultSmtpAccount() {
  if (!hasAnyEnv("SEED_SMTP_EMAIL", "SEED_SMTP_HOST", "SEED_SMTP_USERNAME", "SEED_SMTP_PASSWORD")) {
    return;
  }

  const email = requiredNormalizedEnv("SEED_SMTP_EMAIL").toLowerCase();
  const displayName = normalizedEnv("SEED_SMTP_DISPLAY_NAME") ?? "Indobraga Support";
  const host = requiredNormalizedEnv("SEED_SMTP_HOST");
  const port = positiveIntegerEnv("SEED_SMTP_PORT", 465);
  const security = smtpSecurityEnv("SEED_SMTP_SECURITY", SmtpSecurityMode.SSL_TLS);
  const username = requiredNormalizedEnv("SEED_SMTP_USERNAME");
  const password = requiredRawEnv("SEED_SMTP_PASSWORD");
  const encryptedSmtpPassword = encryptSeedSecret(password);
  const now = new Date();

  await prisma.emailAccount.upsert({
    where: {
      provider_email: {
        provider: EmailProviderType.SMTP_HOSTING,
        email,
      },
    },
    update: {
      displayName,
      status: EmailAccountStatus.CONNECTED,
      smtpHost: host,
      smtpPort: port,
      smtpSecurity: security,
      smtpUsername: username,
      encryptedSmtpPassword,
      lastTestAt: now,
      connectedAt: now,
      lastError: null,
    },
    create: {
      provider: EmailProviderType.SMTP_HOSTING,
      email,
      displayName,
      status: EmailAccountStatus.CONNECTED,
      smtpHost: host,
      smtpPort: port,
      smtpSecurity: security,
      smtpUsername: username,
      encryptedSmtpPassword,
      lastTestAt: now,
      connectedAt: now,
      lastError: null,
    },
  });
}

async function seedSiteSettings() {
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {
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
    },
  });
}

async function seedPortfolioCategories() {
  for (const category of defaultPortfolioCategories) {
    await prisma.portfolioCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
        status: ContentStatus.PUBLISHED,
      },
    });
  }
}

function hasAnyEnv(...keys: string[]): boolean {
  return keys.some((key) => Boolean(normalizedEnv(key)));
}

function normalizedEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}

function requiredNormalizedEnv(key: string): string {
  const value = normalizedEnv(key);
  if (!value) {
    throw new Error(`${key} wajib diisi ketika seed SMTP diaktifkan.`);
  }

  return value;
}

function requiredRawEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} wajib diisi ketika seed SMTP diaktifkan.`);
  }

  return value;
}

function positiveIntegerEnv(key: string, fallback: number): number {
  const value = normalizedEnv(key);
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} wajib berupa angka positif.`);
  }

  return parsed;
}

function smtpSecurityEnv(key: string, fallback: SmtpSecurityMode): SmtpSecurityMode {
  const value = normalizedEnv(key);
  if (!value) {
    return fallback;
  }

  const normalized = value.toLowerCase().replace(/[-\s]/g, "_");
  if (["ssl", "tls", "ssl_tls"].includes(normalized)) {
    return SmtpSecurityMode.SSL_TLS;
  }
  if (["starttls", "start_tls"].includes(normalized)) {
    return SmtpSecurityMode.STARTTLS;
  }
  if (normalized === "none") {
    return SmtpSecurityMode.NONE;
  }

  throw new Error(`${key} hanya mendukung SSL_TLS, STARTTLS, atau NONE.`);
}

function encryptSeedSecret(value: string): string {
  const secret = requiredRawEnv("CREDENTIAL_ENCRYPTION_KEY");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", createEncryptionKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

function createEncryptionKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
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
