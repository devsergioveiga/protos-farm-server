import { eq, sql, desc } from "drizzle-orm";
import type {
  IUserTypeRepository,
  ListUserTypesInput,
  ListUserTypesResult,
} from "../../../domain/user-type/user-type.repository.js";
import { UserType } from "../../../domain/user-type/user-type.entity.js";
import { db } from "./client.js";
import { userTypes } from "./schema.js";

export class DrizzleUserTypeRepository implements IUserTypeRepository {
  async create(userType: UserType): Promise<UserType> {
    await db.insert(userTypes).values({
      id: userType.id,
      name: userType.name,
      slug: userType.slug,
      isSystem: userType.isSystem,
      createdAt: userType.createdAt,
      updatedAt: userType.updatedAt,
    });
    return userType;
  }

  async findById(id: string): Promise<UserType | null> {
    const [row] = await db
      .select()
      .from(userTypes)
      .where(eq(userTypes.id, id));
    if (!row) return null;

    return UserType.reconstitute(
      row.id,
      row.name,
      row.slug,
      row.isSystem,
      row.createdAt,
      row.updatedAt,
    );
  }

  async findBySlug(slug: string): Promise<UserType | null> {
    const [row] = await db
      .select()
      .from(userTypes)
      .where(eq(userTypes.slug, slug));
    if (!row) return null;

    return UserType.reconstitute(
      row.id,
      row.name,
      row.slug,
      row.isSystem,
      row.createdAt,
      row.updatedAt,
    );
  }

  async list(input: ListUserTypesInput): Promise<ListUserTypesResult> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const offset = (page - 1) * limit;

    const [{ count: countResult }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userTypes);

    const total = Number(countResult ?? 0);

    const rows = await db
      .select()
      .from(userTypes)
      .orderBy(desc(userTypes.createdAt))
      .limit(limit)
      .offset(offset);

    const items = rows.map((row) =>
      UserType.reconstitute(
        row.id,
        row.name,
        row.slug,
        row.isSystem,
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

  async update(userType: UserType): Promise<UserType> {
    const now = new Date();
    await db
      .update(userTypes)
      .set({
        name: userType.name,
        slug: userType.slug,
        updatedAt: now,
      })
      .where(eq(userTypes.id, userType.id));
    return UserType.reconstitute(
      userType.id,
      userType.name,
      userType.slug,
      userType.isSystem,
      userType.createdAt,
      now,
    );
  }

  async delete(id: string): Promise<void> {
    await db.delete(userTypes).where(eq(userTypes.id, id));
  }
}
