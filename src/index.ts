import { join } from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Request, type Response } from "express";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { personRoutes } from "./presentation/http/routes/person.routes.js";
import { userRoutes } from "./presentation/http/routes/user.routes.js";
import {
  db,
  checkDatabase,
} from "./infrastructure/persistence/drizzle/client.js";

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

const app = express();
const PORT = process.env.PORT || 3001;

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

runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
