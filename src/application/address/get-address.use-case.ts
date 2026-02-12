import type { Address } from "../../domain/address/address.entity.js";
import type { IAddressRepository } from "../../domain/address/address.repository.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface GetAddressContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class GetAddressUseCase {
  constructor(
    private readonly repository: IAddressRepository,
    private readonly personRepository: IPersonRepository,
  ) {}

  async execute(
    id: string,
    context?: GetAddressContext,
  ): Promise<Address | null> {
    const address = await this.repository.findById(id);
    if (!address) return null;

    if (context) {
      const person = await this.personRepository.findById(address.personId);
      if (!person) return null;

      const isSuperAdmin =
        context.requesterUserTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
      if (!isSuperAdmin && context.requesterOrganizationId != null) {
        if (person.organizationId !== context.requesterOrganizationId) {
          return null;
        }
      }
    }

    return address;
  }
}
