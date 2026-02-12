import { eq } from "drizzle-orm";
import type { IUserRepository } from "../../../domain/user/user.repository.js";
import type { User } from "../../../domain/user/user.entity.js";
import { db } from "./client.js";
import { users } from "./schema.js";
import { toDomain, toPersistence } from "../mappers/user.mapper.js";

export class DrizzleUserRepository implements IUserRepository {
  async create(user: User): Promise<User> {
    const data = toPersistence(user);
    await db.insert(users).values({
      id: data.id,
      email: data.email,
      passwordHash: data.passwordHash,
      personId: data.personId,
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

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await db.select().from(users).where(eq(users.email, email));
    if (!row) return null;
    return toDomain(row);
  }

  async findByPersonId(personId: string): Promise<User | null> {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.personId, personId));
    if (!row) return null;
    return toDomain(row);
  }
}
