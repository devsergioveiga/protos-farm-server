import type { IPermissionRepository } from "../../domain/permission/permission.repository.js";

export interface ListPermissionsInput {
  organizationId?: string;
  userTypeId?: string;
}

export interface ListPermissionsResult {
  items: { userTypeId: string; organizationId: string; resource: string; action: string }[];
}

export class ListPermissionsUseCase {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  async execute(input: ListPermissionsInput): Promise<ListPermissionsResult> {
    const result = await this.permissionRepository.list(input);
    return {
      items: result.items.map((p) => ({
        userTypeId: p.userTypeId,
        organizationId: p.organizationId,
        resource: p.resource,
        action: p.action,
      })),
    };
  }
}
