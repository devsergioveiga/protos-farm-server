import type { Person } from "../../domain/person/person.entity.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface GetPersonContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class GetPersonUseCase {
  constructor(private readonly repository: IPersonRepository) {}

  async execute(
    id: string,
    context?: GetPersonContext,
  ): Promise<Person | null> {
    const person = await this.repository.findById(id);
    if (!person) return null;

    if (context) {
      const isSuperAdmin =
        context.requesterUserTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
      if (!isSuperAdmin && context.requesterOrganizationId != null) {
        if (person.organizationId !== context.requesterOrganizationId) {
          return null;
        }
      }
    }

    return person;
  }
}
