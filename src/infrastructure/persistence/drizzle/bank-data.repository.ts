import { eq, sql, desc } from "drizzle-orm";
import type {
  IBankDataRepository,
  ListBankDataInput,
  ListBankDataResult,
} from "../../../domain/bank-data/bank-data.repository.js";
import { BankData } from "../../../domain/bank-data/bank-data.entity.js";
import { db } from "./client.js";
import { bankData } from "./schema.js";

export class DrizzleBankDataRepository implements IBankDataRepository {
  async create(entity: BankData): Promise<BankData> {
    await db.insert(bankData).values({
      id: entity.id,
      personId: entity.personId,
      identificacao: entity.identificacao,
      numeroBanco: entity.numeroBanco,
      nomeBanco: entity.nomeBanco,
      tipoConta: entity.tipoConta,
      agencia: entity.agencia,
      numeroConta: entity.numeroConta,
      observacao: entity.observacao,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
    return entity;
  }

  async findById(id: string): Promise<BankData | null> {
    const [row] = await db.select().from(bankData).where(eq(bankData.id, id));
    if (!row) return null;

    return BankData.reconstitute(
      row.id,
      row.personId,
      row.identificacao,
      row.numeroBanco,
      row.nomeBanco,
      row.tipoConta,
      row.agencia,
      row.numeroConta,
      row.observacao,
      row.createdAt,
      row.updatedAt,
    );
  }

  async list(input: ListBankDataInput): Promise<ListBankDataResult> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const offset = (page - 1) * limit;

    const baseWhere = eq(bankData.personId, input.personId);

    const [{ count: countResult }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bankData)
      .where(baseWhere);

    const total = Number(countResult ?? 0);

    const rows = await db
      .select()
      .from(bankData)
      .where(baseWhere)
      .orderBy(desc(bankData.createdAt))
      .limit(limit)
      .offset(offset);

    const items = rows.map((row) =>
      BankData.reconstitute(
        row.id,
        row.personId,
        row.identificacao,
        row.numeroBanco,
        row.nomeBanco,
        row.tipoConta,
        row.agencia,
        row.numeroConta,
        row.observacao,
        row.createdAt,
        row.updatedAt,
      ),
    );

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async update(entity: BankData): Promise<BankData> {
    const now = new Date();
    await db
      .update(bankData)
      .set({
        identificacao: entity.identificacao,
        numeroBanco: entity.numeroBanco,
        nomeBanco: entity.nomeBanco,
        tipoConta: entity.tipoConta,
        agencia: entity.agencia,
        numeroConta: entity.numeroConta,
        observacao: entity.observacao,
        updatedAt: now,
      })
      .where(eq(bankData.id, entity.id));
    return BankData.reconstitute(
      entity.id,
      entity.personId,
      entity.identificacao,
      entity.numeroBanco,
      entity.nomeBanco,
      entity.tipoConta,
      entity.agencia,
      entity.numeroConta,
      entity.observacao,
      entity.createdAt,
      now,
    );
  }

  async delete(id: string): Promise<void> {
    await db.delete(bankData).where(eq(bankData.id, id));
  }
}
