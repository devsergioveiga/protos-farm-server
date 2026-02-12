import { eq, sql, desc } from "drizzle-orm";
import type {
  IOrganizationRepository,
  ListOrganizationsInput,
  ListOrganizationsResult,
} from "../../../domain/organization/organization.repository.js";
import { Organization } from "../../../domain/organization/organization.entity.js";
import { db } from "./client.js";
import {
  organizations,
  persons,
  clientCategories,
  supplierCategories,
} from "./schema.js";

export class DrizzleOrganizationRepository implements IOrganizationRepository {
  async create(organization: Organization): Promise<Organization> {
    await db.insert(organizations).values({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      isActive: organization.isActive,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    });
    return organization;
  }

  async findById(id: string): Promise<Organization | null> {
    const [row] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id));
    if (!row) return null;

    return Organization.reconstitute(
      row.id,
      row.name,
      row.slug,
      row.isActive,
      row.createdAt,
      row.updatedAt,
    );
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const [row] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug));
    if (!row) return null;

    return Organization.reconstitute(
      row.id,
      row.name,
      row.slug,
      row.isActive,
      row.createdAt,
      row.updatedAt,
    );
  }

  async list(input: ListOrganizationsInput): Promise<ListOrganizationsResult> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const offset = (page - 1) * limit;

    const [{ count: countResult }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(organizations);

    const total = Number(countResult ?? 0);

    const rows = await db
      .select()
      .from(organizations)
      .orderBy(desc(organizations.createdAt))
      .limit(limit)
      .offset(offset);

    const items = rows.map((row) =>
      Organization.reconstitute(
        row.id,
        row.name,
        row.slug,
        row.isActive,
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

  async update(organization: Organization): Promise<Organization> {
    await db
      .update(organizations)
      .set({
        name: organization.name,
        slug: organization.slug,
        isActive: organization.isActive,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organization.id));
    return organization;
  }

  async delete(id: string): Promise<void> {
    await db.delete(organizations).where(eq(organizations.id, id));
  }

  async hasRelatedData(id: string): Promise<boolean> {
    const [personsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(persons)
      .where(eq(persons.organizationId, id));

    const [clientCategoriesCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(clientCategories)
      .where(eq(clientCategories.organizationId, id));

    const [supplierCategoriesCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(supplierCategories)
      .where(eq(supplierCategories.organizationId, id));

    const total =
      Number(personsCount?.count ?? 0) +
      Number(clientCategoriesCount?.count ?? 0) +
      Number(supplierCategoriesCount?.count ?? 0);

    return total > 0;
  }
}
