import type { Response, NextFunction } from "express";
import { DrizzleUserRepository } from "../../../infrastructure/persistence/drizzle/user.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../../domain/user-type/system-user-types.js";
import type { AuthRequest } from "./auth.middleware.js";

const userRepository = new DrizzleUserRepository();

export interface OrgContextRequest extends AuthRequest {
  userTypeId?: string;
  organizationId?: string | null;
}

export async function orgContextMiddleware(
  req: OrgContextRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.userId) {
    next();
    return;
  }

  try {
    const user = await userRepository.findById(req.userId);
    if (!user) {
      req.userTypeId = undefined;
      req.organizationId = undefined;
      next();
      return;
    }

    req.userTypeId = user.userTypeId;
    req.organizationId =
      user.userTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN
        ? null
        : user.organizationId;

    next();
  } catch {
    req.userTypeId = undefined;
    req.organizationId = undefined;
    next();
  }
}
