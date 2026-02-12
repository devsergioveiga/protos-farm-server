import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { DrizzleUserRepository } from "../../../infrastructure/persistence/drizzle/user.repository.js";
import { DrizzlePersonRepository } from "../../../infrastructure/persistence/drizzle/person.repository.js";
import { DrizzleUserTypeRepository } from "../../../infrastructure/persistence/drizzle/user-type.repository.js";
import { CreateUserUseCase } from "../../../application/user/create-user.use-case.js";
import { GetUserUseCase } from "../../../application/user/get-user.use-case.js";
import { ListUsersUseCase } from "../../../application/user/list-users.use-case.js";

const createSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(6, { error: "A senha deve ter no mínimo 6 caracteres" }),
  personId: z.uuid(),
  userTypeId: z.uuid({ message: "Selecione o tipo de usuário" }),
});

const userRepository = new DrizzleUserRepository();
const personRepository = new DrizzlePersonRepository();
const userTypeRepository = new DrizzleUserTypeRepository();
const createUser = new CreateUserUseCase(
  userRepository,
  personRepository,
  userTypeRepository,
);
const getUser = new GetUserUseCase(userRepository);
const listUsers = new ListUsersUseCase(userRepository);

function userToJson(user: {
  id: string;
  email: string;
  personId: string;
  userTypeId: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    personId: user.personId,
    userTypeId: user.userTypeId,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function userListItemToJson(user: {
  id: string;
  email: string;
  personId: string;
  personName: string;
  userTypeId: string;
  userTypeName: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    personId: user.personId,
    personName: user.personName,
    userTypeId: user.userTypeId,
    userTypeName: user.userTypeName,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export const userRoutes = Router();

userRoutes.get("/", async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    const result = await listUsers.execute({ page, limit });
    return res.json({
      items: result.items.map(userListItemToJson),
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao listar usuários";
    return res.status(500).json({ error: message });
  }
});

userRoutes.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const user = await createUser.execute({
      email: parsed.data.email,
      password: parsed.data.password,
      personId: parsed.data.personId,
      userTypeId: parsed.data.userTypeId,
    });
    return res.status(201).json(userToJson(user));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao criar usuário";
    if (
      message.includes("e-mail") ||
      message.includes("usuário") ||
      message.includes("Pessoa")
    ) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
});

userRoutes.get("/:id", async (req: Request, res: Response) => {
  try {
    const user = await getUser.execute(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    return res.json(userToJson(user));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao buscar usuário";
    return res.status(500).json({ error: message });
  }
});
