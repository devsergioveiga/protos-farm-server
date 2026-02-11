import express, { Request, Response } from "express";
import { Client, type ClientConfig } from "pg";

const app = express();
const PORT = process.env.PORT || 3001;

function getDbConfig(): ClientConfig | null {
  // Secrets Manager pode retornar JSON (formato RDS) ou connection string
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
        return {
          host: parsed.host,
          port: parsed.port ?? 5432,
          user: parsed.username ?? parsed.user,
          password: parsed.password,
          database: parsed.dbname ?? parsed.database ?? "postgres",
        };
      } catch {
        return { connectionString: raw };
      }
    }
    return { connectionString: raw };
  }
  if (process.env.PGHOST) {
    return {
      host: process.env.PGHOST,
      port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    };
  }
  return null;
}

async function checkDatabase(): Promise<"ok" | "error"> {
  const config = getDbConfig();
  if (!config) return "ok";
  // RDS requer SSL; sslmode na URL pode sobrescrever rejectUnauthorized - remover e forçar no config
  const baseConfig = "connectionString" in config
    ? { ...config, connectionString: (config.connectionString as string).replace(/[?&]sslmode=[^&]*/g, "").replace(/\?&/, "?").replace(/([^?])\&/, "$1?").replace(/\?$/, "") }
    : config;
  const clientConfig: ClientConfig = { ...baseConfig, ssl: { rejectUnauthorized: false } };
  const client = new Client(clientConfig);
  try {
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    return "ok";
  } catch (err) {
    console.error("Database connection error:", err instanceof Error ? err.message : String(err));
    return "error";
  }
}

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Protos Farm API", status: "ok" });
});

app.get("/health", async (_req: Request, res: Response) => {
  const database = await checkDatabase();
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    database,
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
