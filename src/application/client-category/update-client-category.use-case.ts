import type { ClientCategory } from "../../domain/client-category/client-category.entity.js";
import type { IClientCategoryRepository } from "../../domain/client-category/client-category.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface UpdateClientCategoryInput {
  name?: string;
  description?: string | null;
}

export interface UpdateClientCategoryContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class UpdateClientCategoryUseCase {
  constructor(private readonly repository: IClientCategoryRepository) {}

  async execute(
    id: string,
    input: UpdateClientCategoryInput,
    context?: UpdateClientCategoryContext,
  ): Promise<ClientCategory> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error("Categoria de cliente não encontrada.");
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
      input.description !== undefined ? input.description : existing.description;

    const updated = existing.update(name, description);
    return this.repository.update(updated);
  }
}
