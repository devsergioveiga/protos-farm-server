import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../../../infrastructure/auth/jwt.service.js";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token não fornecido." });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    if (payload.type !== "access") {
      res.status(401).json({ error: "Token inválido." });
      return;
    }
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado." });
  }
}
