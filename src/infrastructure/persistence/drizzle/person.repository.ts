import { eq, sql, desc } from "drizzle-orm";
import type {
  IPersonRepository,
  ListPersonsInput,
  ListPersonsResult,
} from "../../../domain/person/person.repository.js";
import type { Person } from "../../../domain/person/person.entity.js";
import type { Role } from "../../../domain/person/role.vo.js";
import { db } from "./client.js";
import { persons, personRoles } from "./schema.js";
import { toDomain, toPersistence } from "../mappers/person.mapper.js";

export class DrizzlePersonRepository implements IPersonRepository {
  async create(person: Person): Promise<Person> {
    const data = toPersistence(person);
    await db.insert(persons).values({
      id: data.id,
      name: data.name,
      personType: data.personType,
      documentNumber: data.documentNumber,
      organizationId: data.organizationId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });

    if (person.roles.length > 0) {
      await db.insert(personRoles).values(
        person.roles.map((role) => ({
          personId: person.id,
          role,
        })),
      );
    }

    return person;
  }

  async findById(id: string): Promise<Person | null> {
    const [row] = await db.select().from(persons).where(eq(persons.id, id));
    if (!row) return null;

    const rolesRows = await db
      .select()
      .from(personRoles)
      .where(eq(personRoles.personId, id));
    const roles = rolesRows.map((r) => r.role as Role);

    return toDomain(
      {
        id: row.id,
        name: row.name,
        personType: row.personType as "PF" | "PJ",
        documentNumber: row.documentNumber,
        organizationId: row.organizationId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      roles,
    );
  }

  async findByDocument(documentNumber: string): Promise<Person | null> {
    const [row] = await db
      .select()
      .from(persons)
      .where(eq(persons.documentNumber, documentNumber));
    if (!row) return null;

    const rolesRows = await db
      .select()
      .from(personRoles)
      .where(eq(personRoles.personId, row.id));
    const roles = rolesRows.map((r) => r.role as Role);

    return toDomain(
      {
        id: row.id,
        name: row.name,
        personType: row.personType as "PF" | "PJ",
        documentNumber: row.documentNumber,
        organizationId: row.organizationId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      roles,
    );
  }

  async list(input: ListPersonsInput): Promise<ListPersonsResult> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const offset = (page - 1) * limit;

    const orgFilter =
      input.organizationId != null
        ? eq(persons.organizationId, input.organizationId)
        : sql`true`;

    const [{ count: countResult }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(persons)
      .where(orgFilter);
    const total = Number(countResult ?? 0);

    const rows = await db
      .select()
      .from(persons)
      .where(orgFilter)
      .orderBy(desc(persons.createdAt))
      .limit(limit)
      .offset(offset);

    const items: Person[] = [];
    for (const row of rows) {
      const rolesRows = await db
        .select()
        .from(personRoles)
        .where(eq(personRoles.personId, row.id));
      const roles = rolesRows.map((r) => r.role as Role);
      items.push(
        toDomain(
          {
            id: row.id,
            name: row.name,
            personType: row.personType as "PF" | "PJ",
            documentNumber: row.documentNumber,
            organizationId: row.organizationId,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          },
          roles,
        ),
      );
    }

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async update(person: Person): Promise<Person> {
    const data = toPersistence(person);
    await db
      .update(persons)
      .set({
        name: data.name,
        documentNumber: data.documentNumber,
        updatedAt: data.updatedAt,
      })
      .where(eq(persons.id, person.id));

    await db.delete(personRoles).where(eq(personRoles.personId, person.id));
    if (person.roles.length > 0) {
      await db.insert(personRoles).values(
        person.roles.map((role) => ({
          personId: person.id,
          role,
        })),
      );
    }

    return person;
  }

  async delete(id: string): Promise<void> {
    await db.delete(personRoles).where(eq(personRoles.personId, id));
    await db.delete(persons).where(eq(persons.id, id));
  }
}
