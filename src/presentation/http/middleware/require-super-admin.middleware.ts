import type { Response, NextFunction } from "express";
import { DrizzleUserRepository } from "../../../infrastructure/persistence/drizzle/user.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../../domain/user-type/system-user-types.js";
import type { AuthRequest } from "./auth.middleware.js";

const userRepository = new DrizzleUserRepository();

export async function requireSuperAdminMiddleware(
  req: AuthRequest,
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

    if (user.userTypeId !== SYSTEM_USER_TYPE_IDS.SUPER_ADMIN) {
      res
        .status(403)
        .json({
          error: "Acesso negado. Apenas super_admin pode realizar esta ação.",
        });
      return;
    }

    next();
  } catch {
    res.status(500).json({ error: "Erro ao verificar permissões." });
  }
}
