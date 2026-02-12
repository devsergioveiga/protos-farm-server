import type { IPermissionRepository } from "../../domain/permission/permission.repository.js";
import {
  isPermissionAction,
  isResource,
  type PermissionAction,
  type Resource,
} from "../../domain/permission/permission.vo.js";

export interface SavePermissionsInput {
  userTypeId: string;
  organizationId: string;
  permissions: { resource: string; action: string }[];
}

export class SavePermissionsUseCase {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  async execute(input: SavePermissionsInput): Promise<void> {
    const validated = input.permissions.filter(
      (p) => isResource(p.resource) && isPermissionAction(p.action),
    );

    await this.permissionRepository.save({
      userTypeId: input.userTypeId,
      organizationId: input.organizationId,
      permissions: validated as { resource: Resource; action: PermissionAction }[],
    });
  }
}
