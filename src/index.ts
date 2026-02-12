import { join } from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express, { type Request, type Response } from "express";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { authMiddleware } from "./presentation/http/middleware/auth.middleware.js";
import { orgContextMiddleware } from "./presentation/http/middleware/org-context.middleware.js";
import { authRoutes } from "./presentation/http/routes/auth.routes.js";
import { personRoutes } from "./presentation/http/routes/person.routes.js";
import { addressRoutes } from "./presentation/http/routes/address.routes.js";
import { contactRoutes } from "./presentation/http/routes/contact.routes.js";
import { bankDataRoutes } from "./presentation/http/routes/bank-data.routes.js";
import { userRoutes } from "./presentation/http/routes/user.routes.js";
import { organizationRoutes } from "./presentation/http/routes/organization.routes.js";
import { userTypeRoutes } from "./presentation/http/routes/user-type.routes.js";
import { clientCategoryRoutes } from "./presentation/http/routes/client-category.routes.js";
import { supplierCategoryRoutes } from "./presentation/http/routes/supplier-category.routes.js";
import { permissionRoutes } from "./presentation/http/routes/permission.routes.js";
import {
  db,
  checkDatabase,
} from "./infrastructure/persistence/drizzle/client.js";
import {
  seedUserTypes,
  seedDefaultOrganization,
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
    await seedDefaultOrganization();
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
  }),
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

app.use("/api/auth", authRoutes);
app.use("/api/persons", authMiddleware, orgContextMiddleware, addressRoutes);
app.use("/api/persons", authMiddleware, orgContextMiddleware, contactRoutes);
app.use("/api/persons", authMiddleware, orgContextMiddleware, bankDataRoutes);
app.use("/api/persons", authMiddleware, orgContextMiddleware, personRoutes);
app.use("/api/users", authMiddleware, orgContextMiddleware, userRoutes);
app.use(
  "/api/organizations",
  authMiddleware,
  orgContextMiddleware,
  organizationRoutes,
);
app.use(
  "/api/user-types",
  authMiddleware,
  orgContextMiddleware,
  userTypeRoutes,
);
app.use(
  "/api/client-categories",
  authMiddleware,
  orgContextMiddleware,
  clientCategoryRoutes,
);
app.use(
  "/api/supplier-categories",
  authMiddleware,
  orgContextMiddleware,
  supplierCategoryRoutes,
);
app.use(
  "/api/permissions",
  authMiddleware,
  orgContextMiddleware,
  permissionRoutes,
);

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
