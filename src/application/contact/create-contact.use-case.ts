import { Contact } from "../../domain/contact/contact.entity.js";
import type { IContactRepository } from "../../domain/contact/contact.repository.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface CreateContactInput {
  personId: string;
  name: string;
  phone: string;
  descricao?: string | null;
  observacao?: string | null;
}

export interface CreateContactContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class CreateContactUseCase {
  constructor(
    private readonly repository: IContactRepository,
    private readonly personRepository: IPersonRepository,
  ) {}

  async execute(
    input: CreateContactInput,
    context?: CreateContactContext,
  ): Promise<Contact> {
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
      throw new Error("Informe o nome do contato.");
    }

    const phone = input.phone.trim();
    if (!phone) {
      throw new Error("Informe o telefone do contato.");
    }

    const contact = Contact.create(
      input.personId,
      name,
      phone,
      input.descricao?.trim() || null,
      input.observacao?.trim() || null,
    );
    return this.repository.create(contact);
  }
}
