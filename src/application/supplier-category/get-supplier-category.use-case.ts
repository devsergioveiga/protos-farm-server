import type { SupplierCategory } from "../../domain/supplier-category/supplier-category.entity.js";
import type { ISupplierCategoryRepository } from "../../domain/supplier-category/supplier-category.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface GetSupplierCategoryContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class GetSupplierCategoryUseCase {
  constructor(private readonly repository: ISupplierCategoryRepository) {}

  async execute(
    id: string,
    context?: GetSupplierCategoryContext,
  ): Promise<SupplierCategory | null> {
    const supplierCategory = await this.repository.findById(id);
    if (!supplierCategory) return null;

    if (context) {
      const isSuperAdmin =
        context.requesterUserTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
      if (!isSuperAdmin && context.requesterOrganizationId != null) {
        if (
          supplierCategory.organizationId !== context.requesterOrganizationId
        ) {
          return null;
        }
      }
    }

    return supplierCategory;
  }
}
