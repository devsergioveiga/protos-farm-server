import type { IOrganizationRepository } from "../../domain/organization/organization.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface DeleteOrganizationContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class DeleteOrganizationUseCase {
  constructor(private readonly repository: IOrganizationRepository) {}

  async execute(
    id: string,
    context?: DeleteOrganizationContext,
  ): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error("Organização não encontrada.");
    }

    if (context) {
      const isSuperAdmin =
        context.requesterUserTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
      if (!isSuperAdmin && context.requesterOrganizationId != null) {
        if (existing.id !== context.requesterOrganizationId) {
          throw new Error("Acesso negado a esta organização.");
        }
      }
    }

    const hasRelated = await this.repository.hasRelatedData(id);
    if (hasRelated) {
      throw new Error(
        "Não é possível excluir esta organização pois ela possui dados relacionados (pessoas, categorias de clientes ou categorias de fornecedores).",
      );
    }

    await this.repository.delete(id);
  }
}
