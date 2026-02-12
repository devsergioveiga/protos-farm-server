import { Router, type Response } from "express";
import { z } from "zod";
import { DrizzleBankDataRepository } from "../../../infrastructure/persistence/drizzle/bank-data.repository.js";
import { DrizzlePersonRepository } from "../../../infrastructure/persistence/drizzle/person.repository.js";
import { CreateBankDataUseCase } from "../../../application/bank-data/create-bank-data.use-case.js";
import { GetBankDataUseCase } from "../../../application/bank-data/get-bank-data.use-case.js";
import { ListBankDataUseCase } from "../../../application/bank-data/list-bank-data.use-case.js";
import { UpdateBankDataUseCase } from "../../../application/bank-data/update-bank-data.use-case.js";
import { DeleteBankDataUseCase } from "../../../application/bank-data/delete-bank-data.use-case.js";
import { requirePermission } from "../middleware/require-permission.middleware.js";
import type { OrgContextRequest } from "../middleware/org-context.middleware.js";
const tipoContaSchema = z.enum([
  "CONTA_CORRENTE",
  "CONTA_POUPANCA",
  "CONTA_INVESTIMENTO",
]);

const createSchema = z.object({
  identificacao: z.string().min(1).max(255),
  numeroBanco: z.string().min(1).max(20),
  nomeBanco: z.string().min(1).max(255),
  tipoConta: tipoContaSchema,
  agencia: z.string().min(1).max(20),
  numeroConta: z.string().min(1).max(30),
  observacao: z.string().max(500).optional().nullable(),
});

const updateSchema = z.object({
  identificacao: z.string().min(1).max(255),
  numeroBanco: z.string().min(1).max(20),
  nomeBanco: z.string().min(1).max(255),
  tipoConta: tipoContaSchema,
  agencia: z.string().min(1).max(20),
  numeroConta: z.string().min(1).max(30),
  observacao: z.string().max(500).optional().nullable(),
});

const bankDataRepository = new DrizzleBankDataRepository();
const personRepository = new DrizzlePersonRepository();
const createBankData = new CreateBankDataUseCase(
  bankDataRepository,
  personRepository,
);
const getBankData = new GetBankDataUseCase(
  bankDataRepository,
  personRepository,
);
const listBankData = new ListBankDataUseCase(
  bankDataRepository,
  personRepository,
);
const updateBankData = new UpdateBankDataUseCase(
  bankDataRepository,
  personRepository,
);
const deleteBankData = new DeleteBankDataUseCase(
  bankDataRepository,
  personRepository,
);

function bankDataToJson(bd: {
  id: string;
  personId: string;
  identificacao: string;
  numeroBanco: string;
  nomeBanco: string;
  tipoConta: string;
  agencia: string;
  numeroConta: string;
  observacao: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: bd.id,
    personId: bd.personId,
    identificacao: bd.identificacao,
    numeroBanco: bd.numeroBanco,
    nomeBanco: bd.nomeBanco,
    tipoConta: bd.tipoConta,
    agencia: bd.agencia,
    numeroConta: bd.numeroConta,
    observacao: bd.observacao,
    createdAt: bd.createdAt.toISOString(),
    updatedAt: bd.updatedAt.toISOString(),
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

export const bankDataRoutes = Router({ mergeParams: true });

bankDataRoutes.get(
  "/:personId/bank-data",
  requirePermission("bank_data", "read"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      const { personId } = req.params;
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const result = await listBankData.execute(
        { personId, page, limit },
        getOrgContext(req),
      );
      return res.json({
        items: result.items.map(bankDataToJson),
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao listar dados bancários";
      return res.status(500).json({ error: message });
    }
  },
);

bankDataRoutes.post(
  "/:personId/bank-data",
  requirePermission("bank_data", "create"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const { personId } = req.params;
      const data = await createBankData.execute(
        { ...parsed.data, personId },
        getOrgContext(req),
      );
      return res.status(201).json(bankDataToJson(data));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar dados bancários";
      if (message.includes("não encontrada") || message.includes("negado")) {
        return res.status(404).json({ error: message });
      }
      return res.status(400).json({ error: message });
    }
  },
);

bankDataRoutes.get(
  "/:personId/bank-data/:id",
  requirePermission("bank_data", "read"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      const data = await getBankData.execute(
        req.params.id,
        getOrgContext(req),
      );
      if (!data) {
        return res.status(404).json({ error: "Dados bancários não encontrados" });
      }
      return res.json(bankDataToJson(data));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao buscar dados bancários";
      return res.status(500).json({ error: message });
    }
  },
);

bankDataRoutes.put(
  "/:personId/bank-data/:id",
  requirePermission("bank_data", "update"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const data = await updateBankData.execute(
        req.params.id,
        parsed.data,
        getOrgContext(req),
      );
      return res.json(bankDataToJson(data));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao atualizar dados bancários";
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

bankDataRoutes.delete(
  "/:personId/bank-data/:id",
  requirePermission("bank_data", "delete"),
  async (req: OrgContextRequest, res: Response) => {
    try {
      await deleteBankData.execute(req.params.id, getOrgContext(req));
      return res.status(204).send();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao excluir dados bancários";
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
