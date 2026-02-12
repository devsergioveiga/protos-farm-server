import type { SupplierCategory } from "../../domain/supplier-category/supplier-category.entity.js";
import type { ISupplierCategoryRepository } from "../../domain/supplier-category/supplier-category.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface UpdateSupplierCategoryInput {
  name?: string;
  description?: string | null;
}

export interface UpdateSupplierCategoryContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class UpdateSupplierCategoryUseCase {
  constructor(private readonly repository: ISupplierCategoryRepository) {}

  async execute(
    id: string,
    input: UpdateSupplierCategoryInput,
    context?: UpdateSupplierCategoryContext,
  ): Promise<SupplierCategory> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error("Categoria de fornecedor não encontrada.");
    }

    if (context) {
      const isSuperAdmin =
        context.requesterUserTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
      if (!isSuperAdmin && context.requesterOrganizationId != null) {
        if (existing.organizationId !== context.requesterOrganizationId) {
          throw new Error("Acesso negado a esta categoria.");
        }
      }
    }

    const name = input.name?.trim() ?? existing.name;
    const description =
      input.description !== undefined
        ? input.description
        : existing.description;

    const updated = existing.update(name, description);
    return this.repository.update(updated);
  }
}
