import { eq, sql, desc } from "drizzle-orm";
import type {
  ISupplierCategoryRepository,
  ListSupplierCategoriesInput,
  ListSupplierCategoriesResult,
} from "../../../domain/supplier-category/supplier-category.repository.js";
import { SupplierCategory } from "../../../domain/supplier-category/supplier-category.entity.js";
import { db } from "./client.js";
import { supplierCategories } from "./schema.js";

export class DrizzleSupplierCategoryRepository implements ISupplierCategoryRepository {
  async create(supplierCategory: SupplierCategory): Promise<SupplierCategory> {
    await db.insert(supplierCategories).values({
      id: supplierCategory.id,
      name: supplierCategory.name,
      description: supplierCategory.description,
      organizationId: supplierCategory.organizationId,
      createdAt: supplierCategory.createdAt,
      updatedAt: supplierCategory.updatedAt,
    });
    return supplierCategory;
  }

  async findById(id: string): Promise<SupplierCategory | null> {
    const [row] = await db
      .select()
      .from(supplierCategories)
      .where(eq(supplierCategories.id, id));
    if (!row) return null;

    return SupplierCategory.reconstitute(
      row.id,
      row.name,
      row.description,
      row.organizationId,
      row.createdAt,
      row.updatedAt,
    );
  }

  async list(
    input: ListSupplierCategoriesInput,
  ): Promise<ListSupplierCategoriesResult> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const offset = (page - 1) * limit;

    const baseWhere = eq(
      supplierCategories.organizationId,
      input.organizationId,
    );

    const [{ count: countResult }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(supplierCategories)
      .where(baseWhere);

    const total = Number(countResult ?? 0);

    const rows = await db
      .select()
      .from(supplierCategories)
      .where(baseWhere)
      .orderBy(desc(supplierCategories.createdAt))
      .limit(limit)
      .offset(offset);

    const items = rows.map((row) =>
      SupplierCategory.reconstitute(
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

  async update(supplierCategory: SupplierCategory): Promise<SupplierCategory> {
    const now = new Date();
    await db
      .update(supplierCategories)
      .set({
        name: supplierCategory.name,
        description: supplierCategory.description,
        updatedAt: now,
      })
      .where(eq(supplierCategories.id, supplierCategory.id));
    return SupplierCategory.reconstitute(
      supplierCategory.id,
      supplierCategory.name,
      supplierCategory.description,
      supplierCategory.organizationId,
      supplierCategory.createdAt,
      now,
    );
  }

  async delete(id: string): Promise<void> {
    await db.delete(supplierCategories).where(eq(supplierCategories.id, id));
  }
}
