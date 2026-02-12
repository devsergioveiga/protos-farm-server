import type { Address } from "../../domain/address/address.entity.js";
import type { IAddressRepository } from "../../domain/address/address.repository.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import type { UpdateAddressInput } from "../../domain/address/address.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface UpdateAddressContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class UpdateAddressUseCase {
  constructor(
    private readonly repository: IAddressRepository,
    private readonly personRepository: IPersonRepository,
  ) {}

  async execute(
    id: string,
    input: UpdateAddressInput,
    context?: UpdateAddressContext,
  ): Promise<Address> {
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

    const uf = input.uf.trim().toUpperCase();
    if (uf.length !== 2) {
      throw new Error("UF deve ter 2 caracteres.");
    }

    const updated = existing.update(
      input.name.trim(),
      input.logradouro.trim(),
      input.numero.trim(),
      input.bairro.trim(),
      input.cep.trim(),
      input.cidade.trim(),
      uf,
      input.observacao?.trim() ?? existing.observacao,
    );
    return this.repository.update(updated);
  }
}
