import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const DEFAULT_DATABASE_URL = "mysql://indobraga:indobraga@localhost:3306/indobraga";

export function createPrismaAdapter(): PrismaMariaDb {
  const databaseUrl = process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;
  const database = parseDatabaseName(databaseUrl);

  return new PrismaMariaDb(databaseUrl, database ? { database } : undefined);
}

function parseDatabaseName(databaseUrl: string): string | undefined {
  try {
    const parsed = new URL(databaseUrl);
    const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    return database || undefined;
  } catch {
    return undefined;
  }
}
