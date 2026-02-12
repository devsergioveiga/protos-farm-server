import { Router, type Response } from "express";
import { z } from "zod";
import { DrizzlePersonRepository } from "../../../infrastructure/persistence/drizzle/person.repository.js";
import { DrizzleClientCategoryRepository } from "../../../infrastructure/persistence/drizzle/client-category.repository.js";
import { DrizzleSupplierCategoryRepository } from "../../../infrastructure/persistence/drizzle/supplier-category.repository.js";
import { CreatePersonUseCase } from "../../../application/person/create-person.use-case.js";
import { GetPersonUseCase } from "../../../application/person/get-person.use-case.js";
import { ListPersonsUseCase } from "../../../application/person/list-persons.use-case.js";
import { UpdatePersonUseCase } from "../../../application/person/update-person.use-case.js";
import { DeletePersonUseCase } from "../../../application/person/delete-person.use-case.js";
import { requirePermission } from "../middleware/require-permission.middleware.js";
import { SYSTEM_USER_TYPE_IDS } from "../../../domain/user-type/system-user-types.js";
import type { OrgContextRequest } from "../middleware/org-context.middleware.js";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  tradeName: z.string().max(255).nullish(),
  personType: z.enum(["PF", "PJ"]),
  documentNumber: z.string().min(1).max(14),
  organizationId: z.uuid().optional(),
  roles: z
    .array(
      z.enum([
        "USER",
        "CLIENT",
        "SUPPLIER",
        "EMPLOYEE",
        "MANUFACTURER",
        "FARM_OWNER",
      ]),
    )
    .optional()
    .default([]),
  clientCategoryId: z.uuid().nullish(),
  supplierCategoryId: z.uuid().nullish(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255),
  tradeName: z.string().max(255).nullish(),
  documentNumber: z.string().min(1).max(14),
  roles: z
    .array(
      z.enum([
        "USER",
        "CLIENT",
        "SUPPLIER",
        "EMPLOYEE",
        "MANUFACTURER",
        "FARM_OWNER",
      ]),
    )
    .optional()
    .default([]),
  clientCategoryId: z.uuid().nullish(),
  supplierCategoryId: z.uuid().nullish(),
});

const repository = new DrizzlePersonRepository();
const clientCategoryRepository = new DrizzleClientCategoryRepository();
const supplierCategoryRepository = new DrizzleSupplierCategoryRepository();
const createPerson = new CreatePersonUseCase(
  repository,
  clientCategoryRepository,
  supplierCategoryRepository,
);
const getPerson = new GetPersonUseCase(repository);
const listPersons = new ListPersonsUseCase(repository);
const updatePerson = new UpdatePersonUseCase(
  repository,
  clientCategoryRepository,
  supplierCategoryRepository,
);
const deletePerson = new DeletePersonUseCase(repository);

function personToJson(person: {
  id: string;
  name: string;
  tradeName: string | null;
  personType: string;
  documentNumber: string;
  organizationId: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
  clientCategoryId: string | null;
  supplierCategoryId: string | null;
}) {
  return {
    id: person.id,
    name: person.name,
    tradeName: person.tradeName,
    personType: person.personType,
    documentNumber: person.documentNumber,
    organizationId: person.organizationId,
    roles: person.roles,
    clientCategoryId: person.clientCategoryId,
    supplierCategoryId: person.supplierCategoryId,
    createdAt: person.createdAt.toISOString(),
    updatedAt: person.updatedAt.toISOString(),
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

export const personRoutes = Router();

personRoutes.post(
  "/",
  requirePermission("persons", "create"),
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
          error: "Informe a organização para criar a pessoa.",
        });
      }
      const person = await createPerson.execute({
        ...parsed.data,
        organizationId,
      });
      return res.status(201).json(personToJson(person));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar pessoa";
      if (
        message.includes("documento") ||
        message.includes("Tipo") ||
        message.includes("organização") ||
        message.includes("Categoria")
      ) {
        return res.status(400).json({ error: message });
      }
      return res.status(500).json({ error: message });
    }
  },
);

personRoutes.get(
  "/",
  requirePermission("persons", "read"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit
        ? parseInt(String(req.query.limit), 10)
        : 20;
      const queryOrgId =
        typeof req.query.organizationId === "string"
          ? req.query.organizationId
          : undefined;
      const orgIdForFilter = req.organizationId ?? queryOrgId;

      let roles: string[] | undefined;
      const roleParam = req.query.role;
      const rolesParam = req.query.roles;
      if (typeof roleParam === "string" && roleParam) {
        roles = [roleParam];
      } else if (Array.isArray(rolesParam) && rolesParam.length > 0) {
        roles = rolesParam.filter((r): r is string => typeof r === "string");
      } else if (typeof rolesParam === "string" && rolesParam) {
        roles = rolesParam.split(",").map((r) => r.trim()).filter(Boolean);
      }

      const result = await listPersons.execute({
        page,
        limit,
        organizationId: orgIdForFilter,
        roles,
      });
      return res.json({
        items: result.items.map(personToJson),
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao listar pessoas";
      return res.status(500).json({ error: message });
    }
  },
);

personRoutes.get(
  "/:id",
  requirePermission("persons", "read"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      const person = await getPerson.execute(req.params.id, getOrgContext(req));
      if (!person) {
        return res.status(404).json({ error: "Pessoa não encontrada" });
      }
      return res.json(personToJson(person));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao buscar pessoa";
      return res.status(500).json({ error: message });
    }
  },
);

personRoutes.put(
  "/:id",
  requirePermission("persons", "update"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const person = await updatePerson.execute(
        req.params.id,
        parsed.data,
        getOrgContext(req),
      );
      return res.json(personToJson(person));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao atualizar pessoa";
      if (
        message.includes("não encontrada") ||
        message.includes("Acesso negado")
      ) {
        return res.status(404).json({ error: message });
      }
      if (
        message.includes("documento") ||
        message.includes("inválido") ||
        message.includes("Categoria")
      ) {
        return res.status(400).json({ error: message });
      }
      return res.status(500).json({ error: message });
    }
  },
);

personRoutes.delete(
  "/:id",
  requirePermission("persons", "delete"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      await deletePerson.execute(req.params.id, getOrgContext(req));
      return res.status(204).send();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao excluir pessoa";
      if (
        message.includes("não encontrada") ||
        message.includes("Acesso negado")
      ) {
        return res.status(404).json({ error: message });
      }
      return res.status(500).json({ error: message });
    }
  },
);
