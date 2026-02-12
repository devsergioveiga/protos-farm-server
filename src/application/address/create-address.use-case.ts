import { Address } from "../../domain/address/address.entity.js";
import type { IAddressRepository } from "../../domain/address/address.repository.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface CreateAddressInput {
  personId: string;
  name: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
  observacao?: string | null;
}

export interface CreateAddressContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class CreateAddressUseCase {
  constructor(
    private readonly repository: IAddressRepository,
    private readonly personRepository: IPersonRepository,
  ) {}

  async execute(
    input: CreateAddressInput,
    context?: CreateAddressContext,
  ): Promise<Address> {
    const person = await this.personRepository.findById(input.personId);
    if (!person) {
      throw new Error("Pessoa não encontrada.");
    }

    if (context) {
      const isSuperAdmin =
        context.requesterUserTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
      if (!isSuperAdmin && context.requesterOrganizationId != null) {
        if (person.organizationId !== context.requesterOrganizationId) {
          throw new Error("Acesso negado a esta pessoa.");
        }
      }
    }

    const name = input.name.trim();
    if (!name) {
      throw new Error("Informe o nome do endereço.");
    }

    const uf = input.uf.trim().toUpperCase();
    if (uf.length !== 2) {
      throw new Error("UF deve ter 2 caracteres.");
    }

    const address = Address.create(
      input.personId,
      name,
      input.logradouro.trim(),
      input.numero.trim(),
      input.bairro.trim(),
      input.cep.trim(),
      input.cidade.trim(),
      uf,
      input.observacao?.trim() || null,
    );
    return this.repository.create(address);
  }
}
