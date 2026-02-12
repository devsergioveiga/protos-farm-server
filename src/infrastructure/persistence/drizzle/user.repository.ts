import { eq, sql, desc } from "drizzle-orm";
import type {
  IUserRepository,
  ListUsersInput,
  ListUsersResult,
  UserListItem,
} from "../../../domain/user/user.repository.js";
import type { User } from "../../../domain/user/user.entity.js";
import { db } from "./client.js";
import { users, persons, userTypes } from "./schema.js";
import { toDomain, toPersistence } from "../mappers/user.mapper.js";

export class DrizzleUserRepository implements IUserRepository {
  async create(user: User): Promise<User> {
    const data = toPersistence(user);
    await db.insert(users).values({
      id: data.id,
      email: data.email,
      passwordHash: data.passwordHash,
      personId: data.personId,
      userTypeId: data.userTypeId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await db.select().from(users).where(eq(users.id, id));
    if (!row) return null;
    return toDomain(row);
  }

  async findByIdWithOrganization(
    id: string,
  ): Promise<
    | import("../../../domain/user/user.repository.js").UserWithOrganization
    | null
  > {
    const [row] = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        personId: users.personId,
        userTypeId: users.userTypeId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        organizationId: persons.organizationId,
      })
      .from(users)
      .innerJoin(persons, eq(users.personId, persons.id))
      .where(eq(users.id, id));
    if (!row) return null;
    const { organizationId, ...userRow } = row;
    return {
      user: toDomain(userRow),
      organizationId,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await db.select().from(users).where(eq(users.email, email));
    if (!row) return null;
    return toDomain(row);
  }

  async findByEmailWithOrganization(
    email: string,
  ): Promise<
    | import("../../../domain/user/user.repository.js").UserWithOrganization
    | null
  > {
    const [row] = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        personId: users.personId,
        userTypeId: users.userTypeId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        organizationId: persons.organizationId,
      })
      .from(users)
      .innerJoin(persons, eq(users.personId, persons.id))
      .where(eq(users.email, email));
    if (!row) return null;
    const { organizationId, ...userRow } = row;
    return {
      user: toDomain(userRow),
      organizationId,
    };
  }

  async findByPersonId(personId: string): Promise<User | null> {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.personId, personId));
    if (!row) return null;
    return toDomain(row);
  }

  async list(input: ListUsersInput): Promise<ListUsersResult> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const offset = (page - 1) * limit;

    const orgFilter =
      input.organizationId != null
        ? eq(persons.organizationId, input.organizationId)
        : sql`true`;

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        personId: users.personId,
        personName: persons.name,
        userTypeId: users.userTypeId,
        userTypeName: userTypes.name,
        organizationId: persons.organizationId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .innerJoin(persons, eq(users.personId, persons.id))
      .innerJoin(userTypes, eq(users.userTypeId, userTypes.id))
      .where(orgFilter)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count: countResult }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .innerJoin(persons, eq(users.personId, persons.id))
      .where(orgFilter);
    const total = Number(countResult ?? 0);

    const items: UserListItem[] = rows.map((row) => ({
      id: row.id,
      email: row.email,
      personId: row.personId,
      personName: row.personName,
      userTypeId: row.userTypeId,
      userTypeName: row.userTypeName,
      organizationId: row.organizationId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return {
      items,
      total,
      page,
      limit,
    };
  }
}
