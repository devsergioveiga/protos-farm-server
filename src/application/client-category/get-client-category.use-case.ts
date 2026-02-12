import type { ClientCategory } from "../../domain/client-category/client-category.entity.js";
import type { IClientCategoryRepository } from "../../domain/client-category/client-category.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface GetClientCategoryContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class GetClientCategoryUseCase {
  constructor(private readonly repository: IClientCategoryRepository) {}

  async execute(
    id: string,
    context?: GetClientCategoryContext,
  ): Promise<ClientCategory | null> {
    const clientCategory = await this.repository.findById(id);
    if (!clientCategory) return null;

    if (context) {
      const isSuperAdmin =
        context.requesterUserTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
      if (!isSuperAdmin && context.requesterOrganizationId != null) {
        if (clientCategory.organizationId !== context.requesterOrganizationId) {
          return null;
        }
      }
    }

    return clientCategory;
  }
}
