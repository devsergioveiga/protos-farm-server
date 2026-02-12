import type { Contact } from "../../domain/contact/contact.entity.js";
import type { IContactRepository } from "../../domain/contact/contact.repository.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface GetContactContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class GetContactUseCase {
  constructor(
    private readonly repository: IContactRepository,
    private readonly personRepository: IPersonRepository,
  ) {}

  async execute(
    id: string,
    context?: GetContactContext,
  ): Promise<Contact | null> {
    const contact = await this.repository.findById(id);
    if (!contact) return null;

    if (context) {
      const person = await this.personRepository.findById(contact.personId);
      if (!person) return null;

      const isSuperAdmin =
        context.requesterUserTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
      if (!isSuperAdmin && context.requesterOrganizationId != null) {
        if (person.organizationId !== context.requesterOrganizationId) {
          return null;
        }
      }
    }

    return contact;
  }
}
