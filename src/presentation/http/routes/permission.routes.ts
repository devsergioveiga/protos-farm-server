import { Router, type Response } from "express";
import { z } from "zod";
import { SYSTEM_USER_TYPE_IDS } from "../../../domain/user-type/system-user-types.js";
import { RESOURCES } from "../../../domain/permission/permission.vo.js";
import { DrizzlePermissionRepository } from "../../../infrastructure/persistence/drizzle/permission.repository.js";
import { ListPermissionsUseCase } from "../../../application/permission/list-permissions.use-case.js";
import { SavePermissionsUseCase } from "../../../application/permission/save-permissions.use-case.js";
import { requireAdminMiddleware } from "../middleware/require-admin.middleware.js";
import type { OrgContextRequest } from "../middleware/org-context.middleware.js";

const saveSchema = z.object({
  userTypeId: z.uuid(),
  organizationId: z.uuid(),
  permissions: z.array(
    z.object({
      resource: z.string(),
      action: z.enum(["create", "read", "update", "delete"]),
    }),
  ),
});

const permissionRepository = new DrizzlePermissionRepository();
const listPermissions = new ListPermissionsUseCase(permissionRepository);
const savePermissions = new SavePermissionsUseCase(permissionRepository);

export const permissionRoutes = Router();

/** Retorna as permissões efetivas do usuário logado (para uso no frontend). */
permissionRoutes.get("/me", async (req: OrgContextRequest, res: Response) => {
  try {
    if (!req.userId || req.userTypeId == null) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const isSuperAdmin = req.userTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
    const isOrgAdmin = req.userTypeId === SYSTEM_USER_TYPE_IDS.ORG_ADMIN;

    if (isSuperAdmin || isOrgAdmin) {
      return res.json({
        isFullAccess: true,
        permissions: null,
      });
    }

    const organizationId = req.organizationId;
    if (!organizationId) {
      return res.json({
        isFullAccess: false,
        permissions: Object.fromEntries(
          RESOURCES.map((r) => [r, { create: false, read: false, update: false, delete: false }]),
        ),
      });
    }

    const result = await listPermissions.execute({
      userTypeId: req.userTypeId,
      organizationId,
    });

    const permissionsMap: Record<string, { create: boolean; read: boolean; update: boolean; delete: boolean }> = {};
    for (const r of RESOURCES) {
      permissionsMap[r] = { create: false, read: false, update: false, delete: false };
    }
    for (const p of result.items) {
      if (p.resource in permissionsMap) {
        permissionsMap[p.resource][p.action as "create" | "read" | "update" | "delete"] = true;
      }
    }

    return res.json({
      isFullAccess: false,
      permissions: permissionsMap,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao obter permissões";
    return res.status(500).json({ error: message });
  }
});

permissionRoutes.get(
  "/",
  requireAdminMiddleware,
  async (req: OrgContextRequest, res: Response) => {
    try {
      const organizationId = req.query.organizationId as string | undefined;
      const userTypeId = req.query.userTypeId as string | undefined;

      const isOrgAdmin =
        req.userTypeId === SYSTEM_USER_TYPE_IDS.ORG_ADMIN &&
        req.organizationId != null;

      const effectiveOrgId = isOrgAdmin ? req.organizationId : organizationId;

      const result = await listPermissions.execute({
        organizationId: effectiveOrgId ?? undefined,
        userTypeId,
      });

      return res.json({
        items: result.items,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao listar permissões";
      return res.status(500).json({ error: message });
    }
  },
);

permissionRoutes.post(
  "/",
  requireAdminMiddleware,
  async (req: OrgContextRequest, res: Response) => {
    try {
      const parsed = saveSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      const isOrgAdmin =
        req.userTypeId === SYSTEM_USER_TYPE_IDS.ORG_ADMIN &&
        req.organizationId != null;

      if (isOrgAdmin && parsed.data.organizationId !== req.organizationId) {
        return res.status(403).json({
          error: "Org admin só pode alterar permissões da própria organização.",
        });
      }

      await savePermissions.execute(parsed.data);
      return res.status(204).send();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao salvar permissões";
      return res.status(500).json({ error: message });
    }
  },
);
