import type { IContactRepository } from "../../domain/contact/contact.repository.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface DeleteContactContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class DeleteContactUseCase {
  constructor(
    private readonly repository: IContactRepository,
    private readonly personRepository: IPersonRepository,
  ) {}

  async execute(id: string, context?: DeleteContactContext): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error("Contato não encontrado.");
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
          throw new Error("Acesso negado a este contato.");
        }
      }
    }

    await this.repository.delete(id);
  }
}
