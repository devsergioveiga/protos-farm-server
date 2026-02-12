import { eq, sql, desc } from "drizzle-orm";
import type {
  IAddressRepository,
  ListAddressesInput,
  ListAddressesResult,
} from "../../../domain/address/address.repository.js";
import { Address } from "../../../domain/address/address.entity.js";
import { db } from "./client.js";
import { addresses } from "./schema.js";

export class DrizzleAddressRepository implements IAddressRepository {
  async create(address: Address): Promise<Address> {
    await db.insert(addresses).values({
      id: address.id,
      personId: address.personId,
      name: address.name,
      logradouro: address.logradouro,
      numero: address.numero,
      bairro: address.bairro,
      cep: address.cep,
      cidade: address.cidade,
      uf: address.uf,
      observacao: address.observacao,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    });
    return address;
  }

  async findById(id: string): Promise<Address | null> {
    const [row] = await db.select().from(addresses).where(eq(addresses.id, id));
    if (!row) return null;

    return Address.reconstitute(
      row.id,
      row.personId,
      row.name,
      row.logradouro,
      row.numero,
      row.bairro,
      row.cep,
      row.cidade,
      row.uf,
      row.observacao,
      row.createdAt,
      row.updatedAt,
    );
  }

  async list(input: ListAddressesInput): Promise<ListAddressesResult> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const offset = (page - 1) * limit;

    const baseWhere = eq(addresses.personId, input.personId);

    const [{ count: countResult }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(addresses)
      .where(baseWhere);

    const total = Number(countResult ?? 0);

    const rows = await db
      .select()
      .from(addresses)
      .where(baseWhere)
      .orderBy(desc(addresses.createdAt))
      .limit(limit)
      .offset(offset);

    const items = rows.map((row) =>
      Address.reconstitute(
        row.id,
        row.personId,
        row.name,
        row.logradouro,
        row.numero,
        row.bairro,
        row.cep,
        row.cidade,
        row.uf,
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

  async update(address: Address): Promise<Address> {
    const now = new Date();
    await db
      .update(addresses)
      .set({
        name: address.name,
        logradouro: address.logradouro,
        numero: address.numero,
        bairro: address.bairro,
        cep: address.cep,
        cidade: address.cidade,
        uf: address.uf,
        observacao: address.observacao,
        updatedAt: now,
      })
      .where(eq(addresses.id, address.id));
    return Address.reconstitute(
      address.id,
      address.personId,
      address.name,
      address.logradouro,
      address.numero,
      address.bairro,
      address.cep,
      address.cidade,
      address.uf,
      address.observacao,
      address.createdAt,
      now,
    );
  }

  async delete(id: string): Promise<void> {
    await db.delete(addresses).where(eq(addresses.id, id));
  }
}
