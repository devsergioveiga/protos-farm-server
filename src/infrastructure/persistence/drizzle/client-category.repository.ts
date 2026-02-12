import { eq, sql, desc } from "drizzle-orm";
import type {
  IClientCategoryRepository,
  ListClientCategoriesInput,
  ListClientCategoriesResult,
} from "../../../domain/client-category/client-category.repository.js";
import { ClientCategory } from "../../../domain/client-category/client-category.entity.js";
import { db } from "./client.js";
import { clientCategories } from "./schema.js";

export class DrizzleClientCategoryRepository implements IClientCategoryRepository {
  async create(clientCategory: ClientCategory): Promise<ClientCategory> {
    await db.insert(clientCategories).values({
      id: clientCategory.id,
      name: clientCategory.name,
      description: clientCategory.description,
      organizationId: clientCategory.organizationId,
      createdAt: clientCategory.createdAt,
      updatedAt: clientCategory.updatedAt,
    });
    return clientCategory;
  }

  async findById(id: string): Promise<ClientCategory | null> {
    const [row] = await db
      .select()
      .from(clientCategories)
      .where(eq(clientCategories.id, id));
    if (!row) return null;

    return ClientCategory.reconstitute(
      row.id,
      row.name,
      row.description,
      row.organizationId,
      row.createdAt,
      row.updatedAt,
    );
  }

  async list(input: ListClientCategoriesInput): Promise<ListClientCategoriesResult> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const offset = (page - 1) * limit;

    const baseWhere = eq(clientCategories.organizationId, input.organizationId);

    const [{ count: countResult }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(clientCategories)
      .where(baseWhere);

    const total = Number(countResult ?? 0);

    const rows = await db
      .select()
      .from(clientCategories)
      .where(baseWhere)
      .orderBy(desc(clientCategories.createdAt))
      .limit(limit)
      .offset(offset);

    const items = rows.map((row) =>
      ClientCategory.reconstitute(
        row.id,
        row.name,
        row.description,
        row.organizationId,
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

  async update(clientCategory: ClientCategory): Promise<ClientCategory> {
    const now = new Date();
    await db
      .update(clientCategories)
      .set({
        name: clientCategory.name,
        description: clientCategory.description,
        updatedAt: now,
      })
      .where(eq(clientCategories.id, clientCategory.id));
    return ClientCategory.reconstitute(
      clientCategory.id,
      clientCategory.name,
      clientCategory.description,
      clientCategory.organizationId,
      clientCategory.createdAt,
      now,
    );
  }

  async delete(id: string): Promise<void> {
    await db.delete(clientCategories).where(eq(clientCategories.id, id));
  }
}
