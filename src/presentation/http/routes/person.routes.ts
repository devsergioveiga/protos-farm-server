import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { DrizzlePersonRepository } from "../../../infrastructure/persistence/drizzle/person.repository.js";
import { CreatePersonUseCase } from "../../../application/person/create-person.use-case.js";
import { GetPersonUseCase } from "../../../application/person/get-person.use-case.js";
import { ListPersonsUseCase } from "../../../application/person/list-persons.use-case.js";
import { UpdatePersonUseCase } from "../../../application/person/update-person.use-case.js";
import { DeletePersonUseCase } from "../../../application/person/delete-person.use-case.js";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  personType: z.enum(["PF", "PJ"]),
  documentNumber: z.string().min(1).max(14),
  roles: z
    .array(z.enum(["USER", "CLIENT", "SUPPLIER", "EMPLOYEE"]))
    .optional()
    .default([]),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255),
  documentNumber: z.string().min(1).max(14),
  roles: z
    .array(z.enum(["USER", "CLIENT", "SUPPLIER", "EMPLOYEE"]))
    .optional()
    .default([]),
});

const repository = new DrizzlePersonRepository();
const createPerson = new CreatePersonUseCase(repository);
const getPerson = new GetPersonUseCase(repository);
const listPersons = new ListPersonsUseCase(repository);
const updatePerson = new UpdatePersonUseCase(repository);
const deletePerson = new DeletePersonUseCase(repository);

function personToJson(person: {
  id: string;
  name: string;
  personType: string;
  documentNumber: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: person.id,
    name: person.name,
    personType: person.personType,
    documentNumber: person.documentNumber,
    roles: person.roles,
    createdAt: person.createdAt.toISOString(),
    updatedAt: person.updatedAt.toISOString(),
  };
}

export const personRoutes = Router();

personRoutes.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const person = await createPerson.execute(parsed.data);
    return res.status(201).json(personToJson(person));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar pessoa";
    if (message.includes("documento") || message.includes("Tipo")) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
});

personRoutes.get("/", async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    const result = await listPersons.execute({ page, limit });
    return res.json({
      items: result.items.map(personToJson),
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao listar pessoas";
    return res.status(500).json({ error: message });
  }
});

personRoutes.get("/:id", async (req: Request, res: Response) => {
  try {
    const person = await getPerson.execute(req.params.id);
    if (!person) {
      return res.status(404).json({ error: "Pessoa não encontrada" });
    }
    return res.json(personToJson(person));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao buscar pessoa";
    return res.status(500).json({ error: message });
  }
});

personRoutes.put("/:id", async (req: Request, res: Response) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const person = await updatePerson.execute(req.params.id, parsed.data);
    return res.json(personToJson(person));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao atualizar pessoa";
    if (message.includes("não encontrada")) {
      return res.status(404).json({ error: message });
    }
    if (message.includes("documento") || message.includes("inválido")) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
});

personRoutes.delete("/:id", async (req: Request, res: Response) => {
  try {
    await deletePerson.execute(req.params.id);
    return res.status(204).send();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao excluir pessoa";
    if (message.includes("não encontrada")) {
      return res.status(404).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
});
