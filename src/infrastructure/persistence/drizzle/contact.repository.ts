import { eq, sql, desc } from "drizzle-orm";
import type {
  IContactRepository,
  ListContactsInput,
  ListContactsResult,
} from "../../../domain/contact/contact.repository.js";
import { Contact } from "../../../domain/contact/contact.entity.js";
import { db } from "./client.js";
import { contacts } from "./schema.js";

export class DrizzleContactRepository implements IContactRepository {
  async create(contact: Contact): Promise<Contact> {
    await db.insert(contacts).values({
      id: contact.id,
      personId: contact.personId,
      name: contact.name,
      phone: contact.phone,
      descricao: contact.descricao,
      observacao: contact.observacao,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    });
    return contact;
  }

  async findById(id: string): Promise<Contact | null> {
    const [row] = await db.select().from(contacts).where(eq(contacts.id, id));
    if (!row) return null;

    return Contact.reconstitute(
      row.id,
      row.personId,
      row.name,
      row.phone,
      row.descricao,
      row.observacao,
      row.createdAt,
      row.updatedAt,
    );
  }

  async list(input: ListContactsInput): Promise<ListContactsResult> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const offset = (page - 1) * limit;

    const baseWhere = eq(contacts.personId, input.personId);

    const [{ count: countResult }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contacts)
      .where(baseWhere);

    const total = Number(countResult ?? 0);

    const rows = await db
      .select()
      .from(contacts)
      .where(baseWhere)
      .orderBy(desc(contacts.createdAt))
      .limit(limit)
      .offset(offset);

    const items = rows.map((row) =>
      Contact.reconstitute(
        row.id,
        row.personId,
        row.name,
        row.phone,
        row.descricao,
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

  async update(contact: Contact): Promise<Contact> {
    const now = new Date();
    await db
      .update(contacts)
      .set({
        name: contact.name,
        phone: contact.phone,
        descricao: contact.descricao,
        observacao: contact.observacao,
        updatedAt: now,
      })
      .where(eq(contacts.id, contact.id));
    return Contact.reconstitute(
      contact.id,
      contact.personId,
      contact.name,
      contact.phone,
      contact.descricao,
      contact.observacao,
      contact.createdAt,
      now,
    );
  }

  async delete(id: string): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }
}
