import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { DrizzleUserRepository } from "../../../infrastructure/persistence/drizzle/user.repository.js";
import { LoginUseCase } from "../../../application/auth/login.use-case.js";
import { RefreshTokenUseCase } from "../../../application/auth/refresh-token.use-case.js";
import {
  authMiddleware,
  type AuthRequest,
} from "../middleware/auth.middleware.js";
import { SYSTEM_USER_TYPE_IDS } from "../../../domain/user-type/system-user-types.js";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token é obrigatório"),
});

const userRepository = new DrizzleUserRepository();
const loginUseCase = new LoginUseCase(userRepository);
const refreshUseCase = new RefreshTokenUseCase(userRepository);

export const authRoutes = Router();

authRoutes.post("/login", async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.flatten().fieldErrors,
      });
    }
    const result = await loginUseCase.execute({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao fazer login";
    return res.status(401).json({ error: message });
  }
});

authRoutes.post("/refresh", async (req: Request, res: Response) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.flatten().fieldErrors,
      });
    }
    const result = await refreshUseCase.execute({
      refreshToken: parsed.data.refreshToken,
    });
    return res.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao renovar token";
    return res.status(401).json({ error: message });
  }
});

authRoutes.get(
  "/me",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Não autenticado." });
      }
      const result = await userRepository.findByIdWithOrganization(req.userId);
      if (!result) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }
      const organizationId =
        result.user.userTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN
          ? null
          : result.organizationId;
      return res.json({
        id: result.user.id,
        email: result.user.email,
        personId: result.user.personId,
        userTypeId: result.user.userTypeId,
        organizationId,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao buscar usuário";
      return res.status(500).json({ error: message });
    }
  },
);
