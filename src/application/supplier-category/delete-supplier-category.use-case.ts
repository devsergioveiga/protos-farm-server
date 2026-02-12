import type { ISupplierCategoryRepository } from "../../domain/supplier-category/supplier-category.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface DeleteSupplierCategoryContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class DeleteSupplierCategoryUseCase {
  constructor(private readonly repository: ISupplierCategoryRepository) {}

  async execute(
    id: string,
    context?: DeleteSupplierCategoryContext,
  ): Promise<void> {
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

    await this.repository.delete(id);
  }
}
