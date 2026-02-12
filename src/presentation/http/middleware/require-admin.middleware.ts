import type { Response, NextFunction } from "express";
import { DrizzleUserRepository } from "../../../infrastructure/persistence/drizzle/user.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../../domain/user-type/system-user-types.js";
import type { OrgContextRequest } from "./org-context.middleware.js";

const userRepository = new DrizzleUserRepository();

/** Exige SUPER_ADMIN ou ORG_ADMIN. Org admin tem acesso limitado à própria organização. */
export async function requireAdminMiddleware(
  req: OrgContextRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }

  try {
    const user = await userRepository.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado." });
      return;
    }

    const isSuperAdmin = user.userTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
    const isOrgAdmin = user.userTypeId === SYSTEM_USER_TYPE_IDS.ORG_ADMIN;

    if (!isSuperAdmin && !isOrgAdmin) {
      res.status(403).json({
        error: "Acesso negado. Apenas super_admin ou org_admin podem gerenciar permissões.",
      });
      return;
    }

    next();
  } catch {
    res.status(500).json({ error: "Erro ao verificar permissões." });
  }
}
