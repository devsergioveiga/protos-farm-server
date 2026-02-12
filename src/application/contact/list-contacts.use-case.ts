import type {
  IContactRepository,
  ListContactsInput,
  ListContactsResult,
} from "../../domain/contact/contact.repository.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface ListContactsContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class ListContactsUseCase {
  constructor(
    private readonly repository: IContactRepository,
    private readonly personRepository: IPersonRepository,
  ) {}

  async execute(
    input: ListContactsInput,
    context?: ListContactsContext,
  ): Promise<ListContactsResult> {
    if (context) {
      const person = await this.personRepository.findById(input.personId);
      if (!person) {
        return { items: [], total: 0, page: 1, limit: 20 };
      }

      const isSuperAdmin =
        context.requesterUserTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
      if (!isSuperAdmin && context.requesterOrganizationId != null) {
        if (person.organizationId !== context.requesterOrganizationId) {
          return { items: [], total: 0, page: 1, limit: 20 };
        }
      }
    }

    return this.repository.list(input);
  }
}
