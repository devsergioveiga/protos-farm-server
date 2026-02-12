import { Router, type Response } from "express";
import { z } from "zod";
import { DrizzleSupplierCategoryRepository } from "../../../infrastructure/persistence/drizzle/supplier-category.repository.js";
import { CreateSupplierCategoryUseCase } from "../../../application/supplier-category/create-supplier-category.use-case.js";
import { GetSupplierCategoryUseCase } from "../../../application/supplier-category/get-supplier-category.use-case.js";
import { ListSupplierCategoriesUseCase } from "../../../application/supplier-category/list-supplier-categories.use-case.js";
import { UpdateSupplierCategoryUseCase } from "../../../application/supplier-category/update-supplier-category.use-case.js";
import { DeleteSupplierCategoryUseCase } from "../../../application/supplier-category/delete-supplier-category.use-case.js";
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

const repository = new DrizzleSupplierCategoryRepository();
const createSupplierCategory = new CreateSupplierCategoryUseCase(repository);
const getSupplierCategory = new GetSupplierCategoryUseCase(repository);
const listSupplierCategories = new ListSupplierCategoriesUseCase(repository);
const updateSupplierCategory = new UpdateSupplierCategoryUseCase(repository);
const deleteSupplierCategory = new DeleteSupplierCategoryUseCase(repository);

function supplierCategoryToJson(sc: {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: sc.id,
    name: sc.name,
    description: sc.description,
    organizationId: sc.organizationId,
    createdAt: sc.createdAt.toISOString(),
    updatedAt: sc.updatedAt.toISOString(),
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
    typeof req.query.organizationId === "string"
      ? req.query.organizationId
      : undefined;
  if (isSuperAdmin && queryOrgId) return queryOrgId;
  return req.organizationId ?? null;
}

export const supplierCategoryRoutes = Router();

supplierCategoryRoutes.post(
  "/",
  async (req: OrgContextRequest, res: Response) => {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      const isSuperAdmin = req.userTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
      const organizationId =
        parsed.data.organizationId ??
        (isSuperAdmin ? null : (req.organizationId ?? null));

      if (!organizationId) {
        return res.status(400).json({
          error: "Informe a organização para criar a categoria.",
        });
      }

      const supplierCategory = await createSupplierCategory.execute({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        organizationId,
      });
      return res.status(201).json(supplierCategoryToJson(supplierCategory));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao criar categoria de fornecedor";
      return res.status(400).json({ error: message });
    }
  },
);

supplierCategoryRoutes.get(
  "/",
  async (req: OrgContextRequest, res: Response) => {
    try {
      const orgId = resolveOrganizationId(req);
      if (!orgId) {
        return res.status(400).json({
          error: "Informe a organização para listar categorias.",
        });
      }

      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit
        ? parseInt(String(req.query.limit), 10)
        : 20;
      const result = await listSupplierCategories.execute({
        page,
        limit,
        organizationId: orgId,
      });
      return res.json({
        items: result.items.map(supplierCategoryToJson),
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao listar categorias de fornecedor";
      return res.status(500).json({ error: message });
    }
  },
);

supplierCategoryRoutes.get(
  "/:id",
  async (req: OrgContextRequest, res: Response) => {
    try {
      const supplierCategory = await getSupplierCategory.execute(
        req.params.id,
        getOrgContext(req),
      );
      if (!supplierCategory) {
        return res.status(404).json({
          error: "Categoria de fornecedor não encontrada",
        });
      }
      return res.json(supplierCategoryToJson(supplierCategory));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao buscar categoria de fornecedor";
      return res.status(500).json({ error: message });
    }
  },
);

supplierCategoryRoutes.patch(
  "/:id",
  async (req: OrgContextRequest, res: Response) => {
    try {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const supplierCategory = await updateSupplierCategory.execute(
        req.params.id,
        parsed.data,
        getOrgContext(req),
      );
      return res.json(supplierCategoryToJson(supplierCategory));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao atualizar categoria de fornecedor";
      const status =
        message.includes("não encontrada") || message.includes("Acesso negado")
          ? 404
          : 400;
      return res.status(status).json({ error: message });
    }
  },
);

supplierCategoryRoutes.delete(
  "/:id",
  async (req: OrgContextRequest, res: Response) => {
    try {
      await deleteSupplierCategory.execute(req.params.id, getOrgContext(req));
      return res.status(204).send();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao excluir categoria de fornecedor";
      const status =
        message.includes("não encontrada") || message.includes("Acesso negado")
          ? 404
          : 500;
      return res.status(status).json({ error: message });
    }
  },
);
