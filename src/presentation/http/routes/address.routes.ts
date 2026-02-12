import { Router, type Response } from "express";
import { z } from "zod";
import { DrizzleAddressRepository } from "../../../infrastructure/persistence/drizzle/address.repository.js";
import { DrizzlePersonRepository } from "../../../infrastructure/persistence/drizzle/person.repository.js";
import { CreateAddressUseCase } from "../../../application/address/create-address.use-case.js";
import { GetAddressUseCase } from "../../../application/address/get-address.use-case.js";
import { ListAddressesUseCase } from "../../../application/address/list-addresses.use-case.js";
import { UpdateAddressUseCase } from "../../../application/address/update-address.use-case.js";
import { DeleteAddressUseCase } from "../../../application/address/delete-address.use-case.js";
import { requirePermission } from "../middleware/require-permission.middleware.js";
import type { OrgContextRequest } from "../middleware/org-context.middleware.js";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  logradouro: z.string().min(1).max(255),
  numero: z.string().min(1).max(50),
  bairro: z.string().min(1).max(255),
  cep: z.string().min(1).max(10),
  cidade: z.string().min(1).max(255),
  uf: z.string().length(2),
  observacao: z.string().max(500).optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255),
  logradouro: z.string().min(1).max(255),
  numero: z.string().min(1).max(50),
  bairro: z.string().min(1).max(255),
  cep: z.string().min(1).max(10),
  cidade: z.string().min(1).max(255),
  uf: z.string().length(2),
  observacao: z.string().max(500).optional().nullable(),
});

const addressRepository = new DrizzleAddressRepository();
const personRepository = new DrizzlePersonRepository();
const createAddress = new CreateAddressUseCase(
  addressRepository,
  personRepository,
);
const getAddress = new GetAddressUseCase(addressRepository, personRepository);
const listAddresses = new ListAddressesUseCase(
  addressRepository,
  personRepository,
);
const updateAddress = new UpdateAddressUseCase(
  addressRepository,
  personRepository,
);
const deleteAddress = new DeleteAddressUseCase(
  addressRepository,
  personRepository,
);

function addressToJson(addr: {
  id: string;
  personId: string;
  name: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
  observacao: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: addr.id,
    personId: addr.personId,
    name: addr.name,
    logradouro: addr.logradouro,
    numero: addr.numero,
    bairro: addr.bairro,
    cep: addr.cep,
    cidade: addr.cidade,
    uf: addr.uf,
    observacao: addr.observacao,
    createdAt: addr.createdAt.toISOString(),
    updatedAt: addr.updatedAt.toISOString(),
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

export const addressRoutes = Router({ mergeParams: true });

addressRoutes.get(
  "/:personId/addresses",
  requirePermission("addresses", "read"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      const { personId } = req.params;
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit
        ? parseInt(String(req.query.limit), 10)
        : 20;
      const result = await listAddresses.execute(
        { personId, page, limit },
        getOrgContext(req),
      );
      return res.json({
        items: result.items.map(addressToJson),
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao listar endereços";
      return res.status(500).json({ error: message });
    }
  },
);

addressRoutes.post(
  "/:personId/addresses",
  requirePermission("addresses", "create"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const { personId } = req.params;
      const address = await createAddress.execute(
        { ...parsed.data, personId },
        getOrgContext(req),
      );
      return res.status(201).json(addressToJson(address));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar endereço";
      if (message.includes("não encontrada") || message.includes("negado")) {
        return res.status(404).json({ error: message });
      }
      return res.status(400).json({ error: message });
    }
  },
);

addressRoutes.get(
  "/:personId/addresses/:id",
  requirePermission("addresses", "read"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      const address = await getAddress.execute(
        req.params.id,
        getOrgContext(req),
      );
      if (!address) {
        return res.status(404).json({ error: "Endereço não encontrado" });
      }
      return res.json(addressToJson(address));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao buscar endereço";
      return res.status(500).json({ error: message });
    }
  },
);

addressRoutes.put(
  "/:personId/addresses/:id",
  requirePermission("addresses", "update"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const address = await updateAddress.execute(
        req.params.id,
        parsed.data,
        getOrgContext(req),
      );
      return res.json(addressToJson(address));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao atualizar endereço";
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

addressRoutes.delete(
  "/:personId/addresses/:id",
  requirePermission("addresses", "delete"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      await deleteAddress.execute(req.params.id, getOrgContext(req));
      return res.status(204).send();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao excluir endereço";
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
