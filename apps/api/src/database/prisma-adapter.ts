import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const DEFAULT_DATABASE_URL = "mysql://indobraga:indobraga@localhost:3306/indobraga";

type ParsedDatabaseUrl = {
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
};

export function createPrismaAdapter(): PrismaMariaDb {
  const databaseUrl = process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;
  const parsed = parseDatabaseUrl(databaseUrl);

  // If the URL can't be parsed, fall back to handing the raw string to the
  // driver so we never make a bad connection worse.
  if (!parsed) {
    return new PrismaMariaDb(databaseUrl);
  }

  return new PrismaMariaDb(
    {
      host: parsed.host,
      port: parsed.port,
      user: parsed.user,
      password: parsed.password,
      database: parsed.database,
      // Pool resilience. The driver defaults are too aggressive for a
      // long-running server: connectTimeout is only 1s, so any connection
      // whose handshake briefly exceeds 1s (e.g. MySQL reverse-DNS lookup on
      // connect) is aborted. The pool then drains to zero and every borrower
      // fails with "pool timeout ... active=0 idle=0". Widening the timeouts
      // lets the fixed pool establish and stay populated.
      connectionLimit: 10,
      connectTimeout: 10_000,
      acquireTimeout: 20_000,
    },
    parsed.database ? { database: parsed.database } : undefined,
  );
}

function parseDatabaseUrl(databaseUrl: string): ParsedDatabaseUrl | null {
  try {
    const url = new URL(databaseUrl);
    const database = decodeURIComponent(url.pathname.replace(/^\/+/, "")) || undefined;

    return {
      host: url.hostname || "localhost",
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database,
    };
  } catch {
    return null;
  }
}
