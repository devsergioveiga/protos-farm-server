import type { User } from "../../domain/user/user.entity.js";
import type { IUserRepository } from "../../domain/user/user.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface GetUserContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class GetUserUseCase {
  constructor(private readonly repository: IUserRepository) {}

  async execute(
    id: string,
    context?: GetUserContext,
  ): Promise<User | null> {
    const user = await this.repository.findById(id);
    if (!user) return null;

    if (context) {
      const isSuperAdmin =
        context.requesterUserTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
      if (!isSuperAdmin && context.requesterOrganizationId != null) {
        if (user.organizationId !== context.requesterOrganizationId) {
          return null;
        }
      }
    }

    return user;
  }
}
