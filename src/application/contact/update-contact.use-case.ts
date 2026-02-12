import type { Contact } from "../../domain/contact/contact.entity.js";
import type { IContactRepository } from "../../domain/contact/contact.repository.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import type { UpdateContactInput } from "../../domain/contact/contact.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface UpdateContactContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class UpdateContactUseCase {
  constructor(
    private readonly repository: IContactRepository,
    private readonly personRepository: IPersonRepository,
  ) {}

  async execute(
    id: string,
    input: UpdateContactInput,
    context?: UpdateContactContext,
  ): Promise<Contact> {
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

    const name = input.name.trim();
    if (!name) {
      throw new Error("Informe o nome do contato.");
    }

    const phone = input.phone.trim();
    if (!phone) {
      throw new Error("Informe o telefone do contato.");
    }

    const updated = existing.update(
      name,
      phone,
      input.descricao?.trim() ?? existing.descricao,
      input.observacao?.trim() ?? existing.observacao,
    );
    return this.repository.update(updated);
  }
}
