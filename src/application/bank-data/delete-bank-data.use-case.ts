import type { IBankDataRepository } from "../../domain/bank-data/bank-data.repository.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface DeleteBankDataContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class DeleteBankDataUseCase {
  constructor(
    private readonly repository: IBankDataRepository,
    private readonly personRepository: IPersonRepository,
  ) {}

  async execute(id: string, context?: DeleteBankDataContext): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error("Dados bancários não encontrados.");
    }

    if (context) {
      const person = await this.personRepository.findById(existing.personId);
      if (!person) {
        throw new Error("Pessoa não encontrada.");
      }

      const isSuperAdmin =
        context.requesterUserTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
      if (!isSuperAdmin && context.requesterOrganizationId != null) {
        if (person.organizationId !== context.requesterOrganizationId) {
          throw new Error("Acesso negado a estes dados bancários.");
        }
      }
    }

    await this.repository.delete(id);
  }
}
