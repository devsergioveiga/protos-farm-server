import { Router, type Response } from "express";
import { z } from "zod";
import { DrizzleContactRepository } from "../../../infrastructure/persistence/drizzle/contact.repository.js";
import { DrizzlePersonRepository } from "../../../infrastructure/persistence/drizzle/person.repository.js";
import { CreateContactUseCase } from "../../../application/contact/create-contact.use-case.js";
import { GetContactUseCase } from "../../../application/contact/get-contact.use-case.js";
import { ListContactsUseCase } from "../../../application/contact/list-contacts.use-case.js";
import { UpdateContactUseCase } from "../../../application/contact/update-contact.use-case.js";
import { DeleteContactUseCase } from "../../../application/contact/delete-contact.use-case.js";
import { requirePermission } from "../middleware/require-permission.middleware.js";
import type { OrgContextRequest } from "../middleware/org-context.middleware.js";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  phone: z.string().min(1).max(50),
  descricao: z.string().max(500).optional().nullable(),
  observacao: z.string().max(500).optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255),
  phone: z.string().min(1).max(50),
  descricao: z.string().max(500).optional().nullable(),
  observacao: z.string().max(500).optional().nullable(),
});

const contactRepository = new DrizzleContactRepository();
const personRepository = new DrizzlePersonRepository();
const createContact = new CreateContactUseCase(
  contactRepository,
  personRepository,
);
const getContact = new GetContactUseCase(contactRepository, personRepository);
const listContacts = new ListContactsUseCase(
  contactRepository,
  personRepository,
);
const updateContact = new UpdateContactUseCase(
  contactRepository,
  personRepository,
);
const deleteContact = new DeleteContactUseCase(
  contactRepository,
  personRepository,
);

function contactToJson(contact: {
  id: string;
  personId: string;
  name: string;
  phone: string;
  descricao: string | null;
  observacao: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: contact.id,
    personId: contact.personId,
    name: contact.name,
    phone: contact.phone,
    descricao: contact.descricao,
    observacao: contact.observacao,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  };
}

function getOrgContext(req: OrgContextRequest) {
  return req.userTypeId != null
    ? {
        requesterUserTypeId: req.userTypeId,
        requesterOrganizationId: req.organizationId ?? null,
      }
    : undefined;
}

export const contactRoutes = Router({ mergeParams: true });

contactRoutes.get(
  "/:personId/contacts",
  requirePermission("contacts", "read"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      const { personId } = req.params;
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit
        ? parseInt(String(req.query.limit), 10)
        : 20;
      const result = await listContacts.execute(
        { personId, page, limit },
        getOrgContext(req),
      );
      return res.json({
        items: result.items.map(contactToJson),
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao listar contatos";
      return res.status(500).json({ error: message });
    }
  },
);

contactRoutes.post(
  "/:personId/contacts",
  requirePermission("contacts", "create"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const { personId } = req.params;
      const contact = await createContact.execute(
        { ...parsed.data, personId },
        getOrgContext(req),
      );
      return res.status(201).json(contactToJson(contact));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar contato";
      if (message.includes("não encontrada") || message.includes("negado")) {
        return res.status(404).json({ error: message });
      }
      return res.status(400).json({ error: message });
    }
  },
);

contactRoutes.get(
  "/:personId/contacts/:id",
  requirePermission("contacts", "read"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      const contact = await getContact.execute(
        req.params.id,
        getOrgContext(req),
      );
      if (!contact) {
        return res.status(404).json({ error: "Contato não encontrado" });
      }
      return res.json(contactToJson(contact));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao buscar contato";
      return res.status(500).json({ error: message });
    }
  },
);

contactRoutes.put(
  "/:personId/contacts/:id",
  requirePermission("contacts", "update"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const contact = await updateContact.execute(
        req.params.id,
        parsed.data,
        getOrgContext(req),
      );
      return res.json(contactToJson(contact));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao atualizar contato";
      if (
        message.includes("não encontrado") ||
        message.includes("Acesso negado")
      ) {
        return res.status(404).json({ error: message });
      }
      return res.status(400).json({ error: message });
    }
  },
);

contactRoutes.delete(
  "/:personId/contacts/:id",
  requirePermission("contacts", "delete"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      await deleteContact.execute(req.params.id, getOrgContext(req));
      return res.status(204).send();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao excluir contato";
      if (
        message.includes("não encontrado") ||
        message.includes("Acesso negado")
      ) {
        return res.status(404).json({ error: message });
      }
      return res.status(500).json({ error: message });
    }
  },
);
