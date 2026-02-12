import { SupplierCategory } from "../../domain/supplier-category/supplier-category.entity.js";
import type { ISupplierCategoryRepository } from "../../domain/supplier-category/supplier-category.repository.js";

export interface CreateSupplierCategoryInput {
  name: string;
  description?: string | null;
  organizationId: string;
}

export class CreateSupplierCategoryUseCase {
  constructor(private readonly repository: ISupplierCategoryRepository) {}

  async execute(input: CreateSupplierCategoryInput): Promise<SupplierCategory> {
    const name = input.name.trim();
    if (!name) {
      throw new Error("Informe o nome da categoria.");
    }

    const supplierCategory = SupplierCategory.create(
      name,
      input.organizationId,
      input.description?.trim() || null,
    );
    return this.repository.create(supplierCategory);
  }
}
