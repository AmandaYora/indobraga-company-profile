import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@indobraga.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      name: "Admin Indobraga",
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash,
    },
    create: {
      name: "Admin Indobraga",
      email,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

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

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
