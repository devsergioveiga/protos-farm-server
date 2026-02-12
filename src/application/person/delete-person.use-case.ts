import type { IPersonRepository } from "../../domain/person/person.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface DeletePersonContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class DeletePersonUseCase {
  constructor(private readonly repository: IPersonRepository) {}

  async execute(id: string, context?: DeletePersonContext): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error("Pessoa não encontrada.");
    }

    if (context) {
      const isSuperAdmin =
        context.requesterUserTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
      if (!isSuperAdmin && context.requesterOrganizationId != null) {
        if (existing.organizationId !== context.requesterOrganizationId) {
          throw new Error("Acesso negado a esta pessoa.");
        }
      }
    }

    await this.repository.delete(id);
  }
}
