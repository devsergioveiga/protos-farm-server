import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { DrizzleUserRepository } from "../../../infrastructure/persistence/drizzle/user.repository.js";
import { DrizzlePersonRepository } from "../../../infrastructure/persistence/drizzle/person.repository.js";
import { CreateUserUseCase } from "../../../application/user/create-user.use-case.js";
import { GetUserUseCase } from "../../../application/user/get-user.use-case.js";

const createSchema = z.object({
  email: z.string().email("E-mail inválido").max(255),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  personId: z.string().uuid("ID da pessoa inválido"),
});

const userRepository = new DrizzleUserRepository();
const personRepository = new DrizzlePersonRepository();
const createUser = new CreateUserUseCase(userRepository, personRepository);
const getUser = new GetUserUseCase(userRepository);

function userToJson(user: {
  id: string;
  email: string;
  personId: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    personId: user.personId,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export const userRoutes = Router();

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
    });
    return res.status(201).json(userToJson(user));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar usuário";
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
