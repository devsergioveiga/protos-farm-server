import { Organization } from "../../domain/organization/organization.entity.js";
import type { IOrganizationRepository } from "../../domain/organization/organization.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface GetOrganizationContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class GetOrganizationUseCase {
  constructor(private readonly repository: IOrganizationRepository) {}

  async execute(
    id: string,
    context?: GetOrganizationContext,
  ): Promise<Organization | null> {
    const organization = await this.repository.findById(id);
    if (!organization) {
      return null;
    }

    if (context) {
      const isSuperAdmin =
        context.requesterUserTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
      if (!isSuperAdmin && context.requesterOrganizationId != null) {
        if (organization.id !== context.requesterOrganizationId) {
          return null;
        }
      }
    }

    return organization;
  }
}
