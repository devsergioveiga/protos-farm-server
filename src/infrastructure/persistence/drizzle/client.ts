import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

function isLocalOrDockerHost(urlOrHost: string): boolean {
  const s = urlOrHost.toLowerCase();
  return s.includes("localhost") || s.includes("127.0.0.1") || s === "postgres";
}

function getConnectionConfig():
  | { connectionString: string }
  | Record<string, unknown> {
  const raw = process.env.DATABASE_URL;
  let host = "localhost";
  if (raw) {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed) as {
          host?: string;
          port?: number;
          username?: string;
          user?: string;
          password?: string;
          dbname?: string;
          database?: string;
        };
        host = parsed.host ?? "localhost";
        const user = parsed.username ?? parsed.user ?? "postgres";
        const password = parsed.password ?? "";
        const port = parsed.port ?? 5432;
        const database = parsed.dbname ?? parsed.database ?? "postgres";
        const connectionString = `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
        const useSsl = !isLocalOrDockerHost(host);
        return useSsl
          ? { connectionString, ssl: { rejectUnauthorized: false } }
          : { connectionString };
      } catch {
        return { connectionString: raw };
      }
    }
    const useSsl = !raw.includes("localhost") && !raw.includes("postgres:");
    return useSsl
      ? { connectionString: raw, ssl: { rejectUnauthorized: false } }
      : { connectionString: raw };
  }
  host = process.env.PGHOST ?? "localhost";
  const user = process.env.PGUSER ?? "postgres";
  const password = process.env.PGPASSWORD ?? "";
  const port = process.env.PGPORT ?? "5432";
  const database = process.env.PGDATABASE ?? "postgres";
  const connectionString = `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  const useSsl = !isLocalOrDockerHost(host);
  return useSsl
    ? { connectionString, ssl: { rejectUnauthorized: false } }
    : { connectionString };
}

const config = getConnectionConfig();
const pool = new Pool(config);
export const db = drizzle(pool, { schema });

export async function checkDatabase(): Promise<"ok" | "error"> {
  if (!process.env.DATABASE_URL && !process.env.PGHOST) return "ok";
  try {
    await pool.query("SELECT 1");
    return "ok";
  } catch (err) {
    console.error(
      "Database connection error:",
      err instanceof Error ? err.message : String(err),
    );
    return "error";
  }
}
