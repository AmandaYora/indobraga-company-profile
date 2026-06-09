import "dotenv/config";
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
import nodemailer from "nodemailer";
import { createPrismaAdapter } from "../src/database/prisma-adapter";

const prisma = new PrismaClient({ adapter: createPrismaAdapter() });

async function main() {
  await seedAdminUsers();
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

async function seedAdminUsers() {
  const users = [
    {
      name: normalizedEnv("SEED_SUPER_ADMIN_NAME") ?? "Dimas Prasetio",
      email: (
        normalizedEnv("SEED_SUPER_ADMIN_EMAIL") ?? "dimas.prasetio3101@gmail.com"
      ).toLowerCase(),
      password: process.env.SEED_SUPER_ADMIN_PASSWORD ?? "Dimasrhr123",
      role: UserRole.SUPER_ADMIN,
    },
    {
      name: normalizedEnv("SEED_CONTENT_EDITOR_NAME") ?? "Indobraga Support",
      email: (normalizedEnv("SEED_CONTENT_EDITOR_EMAIL") ?? "support@indobraga.com").toLowerCase(),
      password: process.env.SEED_CONTENT_EDITOR_PASSWORD ?? "ChangeMe123!",
      role: UserRole.CONTENT_EDITOR,
    },
  ];

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 12);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        status: UserStatus.ACTIVE,
        passwordHash,
      },
      create: {
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
        status: UserStatus.ACTIVE,
      },
    });
  }
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

  // No fake "connected" state: run a real SMTP handshake+auth and record the
  // honest result. A failed verify stores status INVALID + the real error so the
  // admin sees exactly why instead of a falsely-connected account.
  const verification = await verifySeedSmtp({ host, port, security, username, password });
  const status = verification.ok ? EmailAccountStatus.CONNECTED : EmailAccountStatus.INVALID;
  const connectedAt = verification.ok ? now : null;
  const lastError = verification.ok ? null : verification.error;
  if (!verification.ok) {
    console.warn(`[seed] SMTP verify gagal untuk ${email}: ${verification.error ?? "unknown"}`);
  }

  await prisma.emailAccount.upsert({
    where: {
      provider_email: {
        provider: EmailProviderType.SMTP_HOSTING,
        email,
      },
    },
    update: {
      displayName,
      status,
      smtpHost: host,
      smtpPort: port,
      smtpSecurity: security,
      smtpUsername: username,
      encryptedSmtpPassword,
      lastTestAt: now,
      connectedAt,
      lastError,
    },
    create: {
      provider: EmailProviderType.SMTP_HOSTING,
      email,
      displayName,
      status,
      smtpHost: host,
      smtpPort: port,
      smtpSecurity: security,
      smtpUsername: username,
      encryptedSmtpPassword,
      lastTestAt: now,
      connectedAt,
      lastError,
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
      showBrandText: false,
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
      showBrandText: false,
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

async function verifySeedSmtp(input: {
  host: string;
  port: number;
  security: SmtpSecurityMode;
  username: string;
  password: string;
}): Promise<{ ok: boolean; error: string | null }> {
  try {
    const transporter = nodemailer.createTransport({
      host: input.host,
      port: input.port,
      secure: input.security === SmtpSecurityMode.SSL_TLS,
      requireTLS: input.security === SmtpSecurityMode.STARTTLS,
      auth: { user: input.username, pass: input.password },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    });
    await transporter.verify();
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "SMTP verify failed." };
  }
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
