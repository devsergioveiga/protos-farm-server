import type {
  IBankDataRepository,
  ListBankDataInput,
  ListBankDataResult,
} from "../../domain/bank-data/bank-data.repository.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface ListBankDataContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class ListBankDataUseCase {
  constructor(
    private readonly repository: IBankDataRepository,
    private readonly personRepository: IPersonRepository,
  ) {}

  async execute(
    input: ListBankDataInput,
    context?: ListBankDataContext,
  ): Promise<ListBankDataResult> {
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
