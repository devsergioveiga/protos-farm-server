import type { IAddressRepository } from "../../domain/address/address.repository.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface DeleteAddressContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class DeleteAddressUseCase {
  constructor(
    private readonly repository: IAddressRepository,
    private readonly personRepository: IPersonRepository,
  ) {}

  async execute(id: string, context?: DeleteAddressContext): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error("Endereço não encontrado.");
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
          throw new Error("Acesso negado a este endereço.");
        }
      }
    }

    await this.repository.delete(id);
  }
}
