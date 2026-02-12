import type { BankData } from "../../domain/bank-data/bank-data.entity.js";
import type { IBankDataRepository } from "../../domain/bank-data/bank-data.repository.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface GetBankDataContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class GetBankDataUseCase {
  constructor(
    private readonly repository: IBankDataRepository,
    private readonly personRepository: IPersonRepository,
  ) {}

  async execute(
    id: string,
    context?: GetBankDataContext,
  ): Promise<BankData | null> {
    const bankData = await this.repository.findById(id);
    if (!bankData) return null;

    if (context) {
      const person = await this.personRepository.findById(bankData.personId);
      if (!person) return null;

      const isSuperAdmin =
        context.requesterUserTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
      if (!isSuperAdmin && context.requesterOrganizationId != null) {
        if (person.organizationId !== context.requesterOrganizationId) {
          return null;
        }
      }
    }

    return bankData;
  }
}
