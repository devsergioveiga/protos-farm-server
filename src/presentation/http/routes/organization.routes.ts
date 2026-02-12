import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { DrizzleOrganizationRepository } from "../../../infrastructure/persistence/drizzle/organization.repository.js";
import { CreateOrganizationUseCase } from "../../../application/organization/create-organization.use-case.js";
import { GetOrganizationUseCase } from "../../../application/organization/get-organization.use-case.js";
import { ListOrganizationsUseCase } from "../../../application/organization/list-organizations.use-case.js";
import { UpdateOrganizationUseCase } from "../../../application/organization/update-organization.use-case.js";
import { DeleteOrganizationUseCase } from "../../../application/organization/delete-organization.use-case.js";
import { requirePermission } from "../middleware/require-permission.middleware.js";
import type { OrgContextRequest } from "../middleware/org-context.middleware.js";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  isActive: z.boolean().optional().default(true),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  isActive: z.boolean(),
});

const repository = new DrizzleOrganizationRepository();
const createOrganization = new CreateOrganizationUseCase(repository);
const getOrganization = new GetOrganizationUseCase(repository);
const listOrganizations = new ListOrganizationsUseCase(repository);
const updateOrganization = new UpdateOrganizationUseCase(repository);
const deleteOrganization = new DeleteOrganizationUseCase(repository);

function getOrgContext(req: OrgContextRequest) {
  return req.userTypeId != null
    ? {
        requesterUserTypeId: req.userTypeId,
        requesterOrganizationId: req.organizationId ?? null,
      }
    : undefined;
}

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

organizationRoutes.get(
  "/",
  requirePermission("organizations", "read"),
  async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit
        ? parseInt(String(req.query.limit), 10)
        : 20;
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
  },
);

organizationRoutes.get(
  "/:id",
  requirePermission("organizations", "read"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      const organization = await getOrganization.execute(
        req.params.id,
        getOrgContext(req),
      );
      if (!organization) {
        return res.status(404).json({ error: "Organização não encontrada." });
      }
      return res.json(organizationToJson(organization));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao obter organização";
      return res.status(500).json({ error: message });
    }
  },
);

organizationRoutes.post(
  "/",
  requirePermission("organizations", "create"),
  async (req: Request, res: Response) => {
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
  },
);

organizationRoutes.put(
  "/:id",
  requirePermission("organizations", "update"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const organization = await updateOrganization.execute(
        {
          id: req.params.id,
          name: parsed.data.name,
          slug: parsed.data.slug?.trim() ?? parsed.data.name,
          isActive: parsed.data.isActive,
        },
        getOrgContext(req),
      );
      return res.json(organizationToJson(organization));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao atualizar organização";
      if (
        message.includes("slug") ||
        message.includes("Slug") ||
        message.includes("não encontrada") ||
        message.includes("Acesso negado")
      ) {
        return res
          .status(message.includes("Acesso negado") ? 403 : 404)
          .json({ error: message });
      }
      return res.status(500).json({ error: message });
    }
  },
);

organizationRoutes.delete(
  "/:id",
  requirePermission("organizations", "delete"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      await deleteOrganization.execute(req.params.id, getOrgContext(req));
      return res.status(204).send();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao excluir organização";
      if (
        message.includes("não encontrada") ||
        message.includes("Acesso negado")
      ) {
        return res.status(404).json({ error: message });
      }
      if (message.includes("dados relacionados")) {
        return res.status(400).json({ error: message });
      }
      return res.status(500).json({ error: message });
    }
  },
);
