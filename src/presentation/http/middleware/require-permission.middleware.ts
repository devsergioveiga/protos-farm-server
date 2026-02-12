import type { Response, NextFunction } from "express";
import { CheckPermissionUseCase } from "../../../application/permission/check-permission.use-case.js";
import { DrizzlePermissionRepository } from "../../../infrastructure/persistence/drizzle/permission.repository.js";
import type { Resource } from "../../../domain/permission/permission.vo.js";
import type { OrgContextRequest } from "./org-context.middleware.js";

export type PermissionAction = "create" | "read" | "update" | "delete";

const permissionRepository = new DrizzlePermissionRepository();
const checkPermission = new CheckPermissionUseCase(permissionRepository);

export function requirePermission(resource: Resource, action: PermissionAction) {
  return async (
    req: OrgContextRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!req.userId || req.userTypeId == null) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const organizationId = req.organizationId ?? null;

    const allowed = await checkPermission.execute({
      userTypeId: req.userTypeId,
      organizationId,
      resource,
      action,
    });

    if (!allowed) {
      res.status(403).json({
        error: "Você não tem permissão para realizar esta ação",
      });
      return;
    }

    next();
  };
}
