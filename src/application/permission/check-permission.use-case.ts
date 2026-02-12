import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";
import type { IPermissionRepository } from "../../domain/permission/permission.repository.js";
import type { PermissionAction, Resource } from "../../domain/permission/permission.vo.js";

export interface CheckPermissionInput {
  userTypeId: string;
  organizationId: string | null;
  resource: Resource;
  action: PermissionAction;
}

export class CheckPermissionUseCase {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  async execute(input: CheckPermissionInput): Promise<boolean> {
    const { userTypeId, organizationId, resource, action } = input;

    if (userTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN) {
      return true;
    }

    if (userTypeId === SYSTEM_USER_TYPE_IDS.ORG_ADMIN) {
      return organizationId != null;
    }

    if (!organizationId) {
      return false;
    }

    return this.permissionRepository.hasPermission(
      userTypeId,
      organizationId,
      resource,
      action,
    );
  }
}
