import { join } from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express, { type Request, type Response } from "express";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { personRoutes } from "./presentation/http/routes/person.routes.js";
import { userRoutes } from "./presentation/http/routes/user.routes.js";
import { organizationRoutes } from "./presentation/http/routes/organization.routes.js";
import { userTypeRoutes } from "./presentation/http/routes/user-type.routes.js";
import {
  db,
  checkDatabase,
} from "./infrastructure/persistence/drizzle/client.js";
import {
  seedUserTypes,
  seedSuperAdminUser,
} from "./infrastructure/persistence/drizzle/seed.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const migrationsFolder = join(__dirname, "..", "drizzle");

async function runMigrations(): Promise<void> {
  if (!process.env.DATABASE_URL && !process.env.PGHOST) return;
  try {
    await migrate(db, { migrationsFolder });
    console.log("Migrations applied successfully");
  } catch (err) {
    console.error("Migration error:", err);
    throw err;
  }
}

async function runSeed(): Promise<void> {
  if (!process.env.DATABASE_URL && !process.env.PGHOST) return;
  try {
    await seedUserTypes();
    await seedSuperAdminUser();
  } catch (err) {
    console.error("Seed error:", err);
    throw err;
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : ["http://localhost:5173", "https://app.protosfarm.com.br"];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    credentials: true,
  })
);
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

app.use("/api/persons", personRoutes);
app.use("/api/users", userRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/user-types", userTypeRoutes);

runMigrations()
  .then(() => runSeed())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
