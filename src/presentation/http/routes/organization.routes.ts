import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { DrizzleOrganizationRepository } from "../../../infrastructure/persistence/drizzle/organization.repository.js";
import { CreateOrganizationUseCase } from "../../../application/organization/create-organization.use-case.js";
import { ListOrganizationsUseCase } from "../../../application/organization/list-organizations.use-case.js";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  isActive: z.boolean().optional().default(true),
});

const repository = new DrizzleOrganizationRepository();
const createOrganization = new CreateOrganizationUseCase(repository);
const listOrganizations = new ListOrganizationsUseCase(repository);

function organizationToJson(org: {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    isActive: org.isActive,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  };
}

export const organizationRoutes = Router();

organizationRoutes.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const organization = await createOrganization.execute({
      name: parsed.data.name,
      slug: parsed.data.slug ?? "",
      isActive: parsed.data.isActive,
    });
    return res.status(201).json(organizationToJson(organization));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao criar organização";
    if (
      message.includes("slug") ||
      message.includes("Slug") ||
      message.includes("Slug inválido")
    ) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
});

organizationRoutes.get("/", async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    const result = await listOrganizations.execute({ page, limit });
    return res.json({
      items: result.items.map(organizationToJson),
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao listar organizações";
    return res.status(500).json({ error: message });
  }
});
