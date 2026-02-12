import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { DrizzleUserTypeRepository } from "../../../infrastructure/persistence/drizzle/user-type.repository.js";
import { requirePermission } from "../middleware/require-permission.middleware.js";
import { CreateUserTypeUseCase } from "../../../application/user-type/create-user-type.use-case.js";
import { ListUserTypesUseCase } from "../../../application/user-type/list-user-types.use-case.js";
import { GetUserTypeUseCase } from "../../../application/user-type/get-user-type.use-case.js";
import { UpdateUserTypeUseCase } from "../../../application/user-type/update-user-type.use-case.js";
import { DeleteUserTypeUseCase } from "../../../application/user-type/delete-user-type.use-case.js";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
});

const repository = new DrizzleUserTypeRepository();
const createUserType = new CreateUserTypeUseCase(repository);
const listUserTypes = new ListUserTypesUseCase(repository);
const getUserType = new GetUserTypeUseCase(repository);
const updateUserType = new UpdateUserTypeUseCase(repository);
const deleteUserType = new DeleteUserTypeUseCase(repository);

function userTypeToJson(ut: {
  id: string;
  name: string;
  slug: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: ut.id,
    name: ut.name,
    slug: ut.slug,
    isSystem: ut.isSystem,
    createdAt: ut.createdAt.toISOString(),
    updatedAt: ut.updatedAt.toISOString(),
  };
}

export const userTypeRoutes = Router();

userTypeRoutes.post("/", requirePermission("user_types", "create"), async (req: Request, res: Response) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const userType = await createUserType.execute({
      name: parsed.data.name,
      slug: parsed.data.slug ?? "",
    });
    return res.status(201).json(userTypeToJson(userType));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao criar tipo de usuário";
    return res.status(400).json({ error: message });
  }
});

userTypeRoutes.get("/", requirePermission("user_types", "read"), async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    const result = await listUserTypes.execute({ page, limit });
    return res.json({
      items: result.items.map(userTypeToJson),
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao listar tipos de usuário";
    return res.status(500).json({ error: message });
  }
});

userTypeRoutes.get("/:id", requirePermission("user_types", "read"), async (req: Request, res: Response) => {
  try {
    const userType = await getUserType.execute(req.params.id);
    if (!userType) {
      return res.status(404).json({ error: "Tipo de usuário não encontrado" });
    }
    return res.json(userTypeToJson(userType));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao buscar tipo de usuário";
    return res.status(500).json({ error: message });
  }
});

userTypeRoutes.patch("/:id", requirePermission("user_types", "update"), async (req: Request, res: Response) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const userType = await updateUserType.execute(req.params.id, parsed.data);
    return res.json(userTypeToJson(userType));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao atualizar tipo de usuário";
    const status =
      message.includes("não encontrado") || message.includes("não pode")
        ? 400
        : 500;
    return res.status(status).json({ error: message });
  }
});

userTypeRoutes.delete("/:id", requirePermission("user_types", "delete"), async (req: Request, res: Response) => {
  try {
    await deleteUserType.execute(req.params.id);
    return res.status(204).send();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao apagar tipo de usuário";
    const status =
      message.includes("não encontrado") ? 404
      : message.includes("não podem ser apagados") ? 400
      : 500;
    return res.status(status).json({ error: message });
  }
});
