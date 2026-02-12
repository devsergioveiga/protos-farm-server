import type { SupplierCategory } from "./supplier-category.entity.js";

export interface CreateSupplierCategoryInput {
  name: string;
  description?: string | null;
  organizationId: string;
}

export interface UpdateSupplierCategoryInput {
  name?: string;
  description?: string | null;
}

export interface ListSupplierCategoriesInput {
  page?: number;
  limit?: number;
  organizationId: string;
}

export interface ListSupplierCategoriesResult {
  items: SupplierCategory[];
  total: number;
  page: number;
  limit: number;
}

export interface ISupplierCategoryRepository {
  create(supplierCategory: SupplierCategory): Promise<SupplierCategory>;
  findById(id: string): Promise<SupplierCategory | null>;
  list(
    input: ListSupplierCategoriesInput,
  ): Promise<ListSupplierCategoriesResult>;
  update(supplierCategory: SupplierCategory): Promise<SupplierCategory>;
  delete(id: string): Promise<void>;
}
