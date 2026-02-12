import { Router, type Response } from "express";
import { z } from "zod";
import { DrizzleClientCategoryRepository } from "../../../infrastructure/persistence/drizzle/client-category.repository.js";
import { CreateClientCategoryUseCase } from "../../../application/client-category/create-client-category.use-case.js";
import { GetClientCategoryUseCase } from "../../../application/client-category/get-client-category.use-case.js";
import { ListClientCategoriesUseCase } from "../../../application/client-category/list-client-categories.use-case.js";
import { UpdateClientCategoryUseCase } from "../../../application/client-category/update-client-category.use-case.js";
import { DeleteClientCategoryUseCase } from "../../../application/client-category/delete-client-category.use-case.js";
import { SYSTEM_USER_TYPE_IDS } from "../../../domain/user-type/system-user-types.js";
import type { OrgContextRequest } from "../middleware/org-context.middleware.js";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional().nullable(),
  organizationId: z.uuid().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(500).optional().nullable(),
});

const repository = new DrizzleClientCategoryRepository();
const createClientCategory = new CreateClientCategoryUseCase(repository);
const getClientCategory = new GetClientCategoryUseCase(repository);
const listClientCategories = new ListClientCategoriesUseCase(repository);
const updateClientCategory = new UpdateClientCategoryUseCase(repository);
const deleteClientCategory = new DeleteClientCategoryUseCase(repository);

function clientCategoryToJson(cc: {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: cc.id,
    name: cc.name,
    description: cc.description,
    organizationId: cc.organizationId,
    createdAt: cc.createdAt.toISOString(),
    updatedAt: cc.updatedAt.toISOString(),
  };
}

function getOrgContext(req: OrgContextRequest) {
  return req.userTypeId != null
    ? {
        requesterUserTypeId: req.userTypeId,
        requesterOrganizationId: req.organizationId ?? null,
      }
    : undefined;
}

function resolveOrganizationId(req: OrgContextRequest): string | null {
  const isSuperAdmin = req.userTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
  const queryOrgId =
    typeof req.query.organizationId === "string" ? req.query.organizationId : undefined;
  if (isSuperAdmin && queryOrgId) return queryOrgId;
  return req.organizationId ?? null;
}

export const clientCategoryRoutes = Router();

clientCategoryRoutes.post("/", async (req: OrgContextRequest, res: Response) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const isSuperAdmin = req.userTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
    const organizationId =
      parsed.data.organizationId ??
      (isSuperAdmin ? null : req.organizationId ?? null);

    if (!organizationId) {
      return res.status(400).json({
        error: "Informe a organização para criar a categoria.",
      });
    }

    const clientCategory = await createClientCategory.execute({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      organizationId,
    });
    return res.status(201).json(clientCategoryToJson(clientCategory));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao criar categoria de cliente";
    return res.status(400).json({ error: message });
  }
});

clientCategoryRoutes.get("/", async (req: OrgContextRequest, res: Response) => {
  try {
    const orgId = resolveOrganizationId(req);
    if (!orgId) {
      return res.status(400).json({
        error: "Informe a organização para listar categorias.",
      });
    }

    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    const result = await listClientCategories.execute({
      page,
      limit,
      organizationId: orgId,
    });
    return res.json({
      items: result.items.map(clientCategoryToJson),
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao listar categorias de cliente";
    return res.status(500).json({ error: message });
  }
});

clientCategoryRoutes.get("/:id", async (req: OrgContextRequest, res: Response) => {
  try {
    const clientCategory = await getClientCategory.execute(
      req.params.id,
      getOrgContext(req),
    );
    if (!clientCategory) {
      return res.status(404).json({ error: "Categoria de cliente não encontrada" });
    }
    return res.json(clientCategoryToJson(clientCategory));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao buscar categoria de cliente";
    return res.status(500).json({ error: message });
  }
});

clientCategoryRoutes.patch("/:id", async (req: OrgContextRequest, res: Response) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const clientCategory = await updateClientCategory.execute(
      req.params.id,
      parsed.data,
      getOrgContext(req),
    );
    return res.json(clientCategoryToJson(clientCategory));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao atualizar categoria de cliente";
    const status =
      message.includes("não encontrada") || message.includes("Acesso negado")
        ? 404
        : 400;
    return res.status(status).json({ error: message });
  }
});

clientCategoryRoutes.delete("/:id", async (req: OrgContextRequest, res: Response) => {
  try {
    await deleteClientCategory.execute(req.params.id, getOrgContext(req));
    return res.status(204).send();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao excluir categoria de cliente";
    const status =
      message.includes("não encontrada") || message.includes("Acesso negado")
        ? 404
        : 500;
    return res.status(status).json({ error: message });
  }
});
