import { defineConfig } from "drizzle-kit";

function getConnectionString(): string {
  const raw = process.env.DATABASE_URL;
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
        const user = parsed.username ?? parsed.user ?? "postgres";
        const password = parsed.password ?? "";
        const host = parsed.host ?? "localhost";
        const port = parsed.port ?? 5432;
        const database = parsed.dbname ?? parsed.database ?? "postgres";
        return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
      } catch {
        return raw;
      }
    }
    return raw;
  }
  const user = process.env.PGUSER ?? "postgres";
  const password = process.env.PGPASSWORD ?? "";
  const host = process.env.PGHOST ?? "localhost";
  const port = process.env.PGPORT ?? "5432";
  const database = process.env.PGDATABASE ?? "postgres";
  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export default defineConfig({
  schema: "./src/infrastructure/persistence/drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getConnectionString(),
  },
});
